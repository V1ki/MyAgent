from sqlalchemy.orm import Session
import asyncio
from typing import List, Dict, Optional, Any
from uuid import UUID
from openai import AsyncOpenAI
import logging

from app.models.provider import ModelImplementation, ApiKey
from app.models.conversation import ConversationTurn, ModelResponse
from app.models.schemas import ModelResponseCreate
from app.services.model_service import ModelImplementationService
from app.services.provider_service import ProviderService


class ModelOrchestrator:
    """
    Service responsible for coordinating parallel model API calls,
    aggregating responses, and managing the communication with LLM providers.
    """

    @staticmethod
    async def call_openai_compatible_api(
        client: AsyncOpenAI,
        provider_model_id: str,
        prompt: str,
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Make an API call to an OpenAI-compatible API.
        """
        try:
            # Prepare messages
            messages = [{"role": "user", "content": prompt}]
            
            # Extract parameters compatible with OpenAI API
            openai_params = {
                "model": provider_model_id,
                "messages": messages,
            }
            
            # Add common parameters if provided
            for param in ["temperature", "top_p", "n", "max_tokens", "presence_penalty", "frequency_penalty"]:
                if param in parameters:
                    openai_params[param] = parameters[param]
            
            # Include any additional parameters
            for key, value in parameters.items():
                if key not in openai_params and key not in ["messages", "model"]:
                    openai_params[key] = value
            
            # Make the API call
            response = await client.chat.completions.create(**openai_params)
            
            # Convert response to dictionary
            # Note: AsyncOpenAI client returns pydantic models that need to be converted
            response_dict = response.model_dump()
            
            return response_dict
        except Exception as e:
            logging.error(f"Error calling OpenAI API: {str(e)}")
            return {"error": f"API error: {str(e)}"}

    @staticmethod
    async def call_model_implementation(
        db: Session,
        implementation_id: UUID,
        prompt: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Call a specific model implementation using its configuration.
        """
        # Get the implementation details
        implementation = ModelImplementationService.get_implementation(db, implementation_id)
        if not implementation:
            return {"error": f"Model implementation with ID {implementation_id} not found"}
        
        if not implementation.is_available:
            return {"error": f"Model implementation {implementation.provider_model_id} is not available"}
        
        # Get the provider details
        provider = ProviderService.get_provider(db, implementation.provider_id)
        if not provider:
            return {"error": f"Provider with ID {implementation.provider_id} not found"}
        
        # Get a valid API key for the provider
        api_key = db.query(ApiKey).filter(ApiKey.provider_id == provider.id).first()
        if not api_key:
            return {"error": f"No API key available for provider {provider.name}"}
        
        # Merge default parameters with provided ones
        merged_parameters = {}
        if implementation.custom_parameters:
            merged_parameters.update(implementation.custom_parameters)
        if parameters:
            merged_parameters.update(parameters)
        
        try:
            # Create an AsyncOpenAI client
            client = AsyncOpenAI(
                api_key=api_key.key,
                base_url=provider.base_url
            )
            
            # Call the model
            result = await ModelOrchestrator.call_openai_compatible_api(
                client=client,
                provider_model_id=implementation.provider_model_id,
                prompt=prompt,
                parameters=merged_parameters
            )
            
            return {
                "implementation_id": str(implementation_id),
                "model_name": implementation.provider_model_id,
                "provider_name": provider.name,
                "result": result
            }
        except Exception as e:
            logging.error(f"Error calling model implementation: {str(e)}")
            return {
                "implementation_id": str(implementation_id),
                "model_name": implementation.provider_model_id,
                "provider_name": provider.name,
                "result": {"error": f"Error: {str(e)}"}
            }

    @staticmethod
    async def process_model_responses(
        responses: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Process and standardize responses from different model providers.
        """
        processed_responses = []
        
        for response in responses:
            implementation_id = response.get("implementation_id")
            model_name = response.get("model_name", "Unknown model")
            provider_name = response.get("provider_name", "Unknown provider")
            result = response.get("result", {})
            
            processed_response = {
                "implementation_id": implementation_id,
                "model_name": model_name,
                "provider_name": provider_name,
                "content": "",
                "metadata": {},
                "error": None
            }
            
            if "error" in result:
                processed_response["error"] = result["error"]
            else:
                # Extract content based on OpenAI response structure
                try:
                    if "choices" in result and len(result["choices"]) > 0:
                        content = result["choices"][0].get("message", {}).get("content", "")
                        processed_response["content"] = content
                    
                    # Store additional metadata
                    processed_response["metadata"] = {
                        "model": result.get("model", ""),
                        "usage": result.get("usage", {}),
                        "created": result.get("created", ""),
                        "id": result.get("id", "")
                    }
                except Exception as e:
                    processed_response["error"] = f"Error processing response: {str(e)}"
            
            processed_responses.append(processed_response)
            
        return processed_responses

    @staticmethod
    async def orchestrate_model_calls(
        db: Session,
        implementation_ids: List[UUID],
        prompt: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Orchestrate parallel calls to multiple model implementations and aggregate their responses.
        """
        # Create tasks for all model implementations
        tasks = [
            ModelOrchestrator.call_model_implementation(
                db=db,
                implementation_id=impl_id,
                prompt=prompt,
                parameters=parameters
            )
            for impl_id in implementation_ids
        ]
        
        # Execute all calls in parallel
        responses = await asyncio.gather(*tasks)
        
        # Process and standardize responses
        processed_responses = await ModelOrchestrator.process_model_responses(responses)
        
        return processed_responses

    @staticmethod
    def save_model_responses(
        db: Session,
        turn_id: UUID,
        responses: List[Dict[str, Any]],
        input_version_id: Optional[UUID] = None
    ) -> List[ModelResponse]:
        """
        Save model responses to the database.
        """
        saved_responses = []
        
        for response in responses:
            model_response = ModelResponseCreate(
                turn_id=turn_id,
                model_implementation_id=UUID(response["implementation_id"]) if response["implementation_id"] else None,
                content=response["content"],
                response_metadata=response["metadata"],  # Changed from metadata to response_metadata
                is_selected=False,
                input_version_id=input_version_id
            )
            
            # Create the model response in the database
            db_response = ModelResponse(
                turn_id=model_response.turn_id,
                model_implementation_id=model_response.model_implementation_id,
                content=model_response.content,
                metadata=model_response.response_metadata,  # Changed from metadata to metadata
                is_selected=model_response.is_selected,
                is_deleted=False,  # This isn't in the create schema, set directly
                input_version_id=model_response.input_version_id
            )
            
            db.add(db_response)
            db.commit()
            db.refresh(db_response)
            saved_responses.append(db_response)
            
        return saved_responses