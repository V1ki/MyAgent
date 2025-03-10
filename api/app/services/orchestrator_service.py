from sqlalchemy.orm import Session
import asyncio
from typing import Iterable, List, Dict, Optional, Any
from uuid import UUID
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from logging import getLogger, basicConfig,INFO, StreamHandler

# Add this at the top of the file after imports
basicConfig(
    level=INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        StreamHandler()  # Outputs to console
    ]
)

from app.models.provider import ModelImplementation, ApiKey
from app.models.conversation import ConversationTurn, ModelResponse
from app.models.schemas import ModelResponseCreate
from app.services.model_service import ModelImplementationService
from app.services.provider_service import ProviderService


logger = getLogger(__name__)


class ModelOrchestrator:
    """
    Service responsible for coordinating parallel model API calls,
    aggregating responses, and managing the communication with LLM providers.
    """
    
    @staticmethod
    def _convert_camel_to_snake_case(camel_case_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert dictionary keys from camelCase to snake_case.
        For example, 'topP' becomes 'top_p'.
        """
        snake_case_dict = {}
        for key, value in camel_case_dict.items():
            # Handle common parameter conversions explicitly
            if key == "topP":
                snake_case_dict["top_p"] = value
            elif key == "maxTokens":
                snake_case_dict["max_tokens"] = value
            elif key == "frequencyPenalty":
                snake_case_dict["frequency_penalty"] = value
            elif key == "presencePenalty":
                snake_case_dict["presence_penalty"] = value
            # General camelCase to snake_case conversion
            else:
                # Convert camelCase to snake_case (e.g., camelCase -> camel_case)
                snake_key = ''.join(['_' + c.lower() if c.isupper() else c for c in key]).lstrip('_')
                snake_case_dict[snake_key] = value
        return snake_case_dict

    @staticmethod
    async def call_openai_compatible_api(
        client: AsyncOpenAI,
        provider_model_id: str,
        messages: str | Iterable[ChatCompletionMessageParam],
        parameters: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Make an API call to an OpenAI-compatible API.
        """
        try:
            # Prepare messages
            if isinstance(messages, str):
                messages = [{"role": "user", "content": messages}]
            
            # Ensure parameters are in snake_case format
            snake_parameters = ModelOrchestrator._convert_camel_to_snake_case(parameters)
            
            # Prepare base OpenAI API parameters
            openai_params = {
                "model": provider_model_id,
                "messages": messages,
            }
            
            # Add common parameters if provided
            for param in ["temperature", "top_p", "n", "max_tokens", "presence_penalty", "frequency_penalty"]:
                if param in snake_parameters:
                    openai_params[param] = snake_parameters[param]
            
            # Include any additional parameters
            for key, value in snake_parameters.items():
                if key not in openai_params and key not in ["messages", "model"]:
                    openai_params[key] = value
            
            logger.info(f"Calling OpenAI API with parameters: {openai_params}")
            # Make the API call
            response = await client.chat.completions.create(**openai_params)
            logger.info(f"Received response: {response}")
            
            # Convert response to dictionary
            # Note: AsyncOpenAI client returns pydantic models that need to be converted
            response_dict = response.model_dump()
            
            return response_dict
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            return {"error": f"API error: {str(e)}"}

    @staticmethod
    async def call_model_implementation(
        db: Session,
        implementation_id: UUID,
        messages: str | Iterable[ChatCompletionMessageParam],
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
            
            start_time = asyncio.get_event_loop().time()
            # Call the model
            result = await ModelOrchestrator.call_openai_compatible_api(
                client=client,
                provider_model_id=implementation.provider_model_id,
                messages=messages,
                parameters=merged_parameters
            )
            end_time = asyncio.get_event_loop().time()
            logger.info(f"response: {result}")
            return {
                "implementation_id": str(implementation_id),
                "model_name": implementation.provider_model_id,
                "provider_name": provider.name,
                "result": result,
                "response_time": end_time - start_time
            }
        except Exception as e:
            logger.error(f"Error calling model implementation: {str(e)}")
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
                        "id": result.get("id", ""),
                        "response_time": response.get("response_time", 0)

                    }
                except Exception as e:
                    processed_response["error"] = f"Error processing response: {str(e)}"
            
            processed_responses.append(processed_response)
            
        return processed_responses

    @staticmethod
    async def orchestrate_model_calls(
        db: Session,
        implementation_ids: List[UUID],
        messages: str | Iterable[ChatCompletionMessageParam],
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
                messages=messages,
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
        turn: ConversationTurn,
        responses: List[Dict[str, Any]],
        input_version_id: Optional[UUID] = None
    ) -> List[ModelResponse]:
        """
        Save model responses to the database.
        """
        saved_responses = []
        
        for response in responses:
            model_response = ModelResponseCreate(
                turn_id=turn.id,
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
                response_metadata=model_response.response_metadata,  # Use the aliased name
                is_selected=model_response.is_selected,
                input_version_id=model_response.input_version_id
            )
            if len(responses) == 1:
                db_response.is_selected = True
            
            db.add(db_response)
            db.commit()
            db.refresh(db_response)
            saved_responses.append(db_response)
        
        return saved_responses