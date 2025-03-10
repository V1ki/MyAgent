from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from uuid import UUID
import asyncio
import json

from app.db.database import get_db
from app.models.schemas import ConversationTurnCreate
from app.models.conversation import ConversationTurn, ModelResponse
from app.services.orchestrator_service import ModelOrchestrator
from app.services.conversation_service import ConversationService
from app.services.model_service import ModelImplementationService
from app.services.provider_service import ProviderService

router = APIRouter(
    prefix="/chat",
    tags=["multi-model-chat"],
    responses={404: {"description": "Not found"}},
)

# Helper function to get model and provider names
def get_model_provider_info(db: Session, implementation_id: UUID) -> Dict[str, str]:
    """Get model and provider names for an implementation ID"""
    try:
        implementation = ModelImplementationService.get_implementation(db, implementation_id)
        if implementation:
            provider = ProviderService.get_provider(db, implementation.provider_id)
            provider_name = provider.name if provider else "Unknown Provider"
            
            return {
                "model_name": f"{implementation.provider_model_id}" if implementation else implementation.provider_model_id,
                "provider_name": provider_name
            }
    except Exception as e:
        print(f"Error getting model info: {e}")
    
    return {
        "model_name": "Unknown Model",
        "provider_name": "Unknown Provider"
    }

@router.post("/multi")
async def chat_with_multiple_models(
    request: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Send a message to multiple models in parallel and receive their responses.
    
    - **conversation_id**: ID of the conversation
    - **model_implementations**: List of model implementation IDs to query
    - **message**: The user's message
    - **parameters**: Optional parameters to customize model behavior
    """
    conversation_id = request.get("conversation_id")
    model_implementation_ids = request.get("model_implementations", [])
    message = request.get("message")
    parameters = request.get("parameters", {})
    
    # Validate required fields
    if not conversation_id:
        raise HTTPException(status_code=400, detail="conversation_id is required")
    if not model_implementation_ids:
        raise HTTPException(status_code=400, detail="At least one model implementation must be specified")
    if not message:
        raise HTTPException(status_code=400, detail="message is required")
    
    try:
        # Convert string IDs to UUIDs
        conversation_id = UUID(conversation_id)
        model_implementation_ids = [UUID(id) for id in model_implementation_ids]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    # Check if conversation exists
    conversation = ConversationService.get_conversation(db, conversation_id)
    if not conversation:
        # Create a new conversation if it doesn't exist
        conversation = ConversationService.create_conversation(db, conversation_id)
    
    # Create a new conversation turn
    new_turn = ConversationTurnCreate(
        conversation_id=conversation_id,
        user_input=message,
        model_parameters=parameters
    )
    db_turn = ConversationTurn(
        conversation_id=new_turn.conversation_id,
        user_input=new_turn.user_input,
        model_parameters=new_turn.model_parameters
    )
    db.add(db_turn)
    db.commit()
    db.refresh(db_turn)

    # build messages
    messages = ConversationService.build_message(conversation)
    # Call multiple models in parallel
    responses = await ModelOrchestrator.orchestrate_model_calls(
        db=db,
        implementation_ids=model_implementation_ids,
        messages=messages,
        parameters=parameters
    )
    
    # Save responses to database
    saved_responses = ModelOrchestrator.save_model_responses(
        db=db,
        turn=db_turn,
        responses=responses
    )
    
    # Cache model and provider info for each implementation ID
    model_info_cache = {}
    for impl_id in model_implementation_ids:
        model_info_cache[str(impl_id)] = get_model_provider_info(db, impl_id)
    
    # Format and return the responses
    result = {
        "turn_id": str(db_turn.id),
        "responses": [
            {
                "id": str(resp.id),
                "model_implementation_id": str(resp.model_implementation_id) if resp.model_implementation_id else None,
                "model_name": model_info_cache.get(str(resp.model_implementation_id), {}).get("model_name", "Unknown Model"),
                "provider_name": model_info_cache.get(str(resp.model_implementation_id), {}).get("provider_name", "Unknown Provider"),
                "content": resp.content,
                "error": next(
                    (r["error"] for r in responses if r["implementation_id"] == str(resp.model_implementation_id)),
                    None
                )
            }
            for resp in saved_responses
        ]
    }
    
    return result

@router.get("/multi/stream")
async def stream_chat_with_multiple_models(
    conversation_id: str,
    models: str,  # Comma-separated list of model implementation IDs
    message: str,
    parameters: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Stream responses from multiple models in parallel using Server-Sent Events (SSE).
    """
    try:
        # Convert and validate parameters
        conv_id = UUID(conversation_id)
        model_ids = [UUID(id.strip()) for id in models.split(",") if id.strip()]
        params = json.loads(parameters) if parameters else {}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid parameter format: {str(e)}")
    
    if not model_ids:
        raise HTTPException(status_code=400, detail="At least one model must be specified")
    
    # Check if conversation exists
    conversation = ConversationService.get_conversation(db, conv_id)
    if not conversation:
        raise HTTPException(status_code=404, detail=f"Conversation with ID {conv_id} not found")
    
    # Create a new conversation turn
    new_turn = ConversationTurnCreate(
        conversation_id=conv_id,
        user_input=message,
        model_parameters=params
    )
    db_turn = ConversationTurn(
        conversation_id=new_turn.conversation_id,
        user_input=new_turn.user_input,
        model_parameters=new_turn.model_parameters
    )
    db.add(db_turn)
    db.commit()
    db.refresh(db_turn)
    
    # Cache model and provider info for each implementation ID
    model_info_cache = {}
    for impl_id in model_ids:
        model_info_cache[str(impl_id)] = get_model_provider_info(db, impl_id)
    
    # This is a placeholder for the actual streaming implementation
    # In a real implementation, you would use SSE to stream partial responses from models
    async def stream_generator():
        # SSE headers
        yield "event: start\n"
        yield f"data: {json.dumps({'turn_id': str(db_turn.id)})}\n\n"
        
        # Start model calls in the background
        responses = await ModelOrchestrator.orchestrate_model_calls(
            db=db,
            implementation_ids=model_ids,
            prompt=message,
            parameters=params
        )
        
        # Simulate streaming by sending each response separately
        for idx, response in enumerate(responses):
            model_info = model_info_cache.get(response['implementation_id'], {})
            model_name = model_info.get("model_name", response['model_name'])
            provider_name = model_info.get("provider_name", response['provider_name'])
            
            yield f"event: model-response\n"
            yield f"data: {json.dumps({
                'model_id': response['implementation_id'],
                'model_implementation_id': response['implementation_id'],
                'model_name': model_name,
                'provider_name': provider_name,
                'content': response['content'],
                'error': response['error']
            })}\n\n"
            
            # Small delay to simulate streaming
            await asyncio.sleep(0.1)
        
        # Save all responses to the database after streaming
        saved_responses = ModelOrchestrator.save_model_responses(
            db=db,
            turn=db_turn,
            responses=responses
        )
        
        # Update the database with model and provider information
        for saved_resp in saved_responses:
            if saved_resp.model_implementation_id:
                model_info = model_info_cache.get(str(saved_resp.model_implementation_id), {})
                if not saved_resp.metadata:
                    saved_resp.metadata = {}
                saved_resp.metadata.update({
                    "model_name": model_info.get("model_name", "Unknown Model"),
                    "provider_name": model_info.get("provider_name", "Unknown Provider")
                })
                
        db.commit()
        
        # Signal completion
        yield "event: end\n"
        yield f"data: {json.dumps({'status': 'complete'})}\n\n"
    
    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream"
    )

@router.put("/turns/{turn_id}/select-response/{response_id}")
async def select_response_as_context(
    turn_id: str,
    response_id: str,
    db: Session = Depends(get_db)
):
    """
    Select a specific model response as the context for future conversation turns.
    """
    try:
        turn_uuid = UUID(turn_id)
        response_uuid = UUID(response_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID format")
    
    # Get the conversation turn
    turn = db.query(ConversationTurn).filter(ConversationTurn.id == turn_uuid).first()
    if not turn:
        raise HTTPException(status_code=404, detail=f"Conversation turn with ID {turn_id} not found")
    
    # Reset all responses to not selected
    for response in turn.responses:
        response.is_selected = False
    
    # Set the selected response
    selected_response = db.query(ModelResponse).filter(ModelResponse.id == response_uuid).first()
    if not selected_response:
        raise HTTPException(status_code=404, detail=f"Response with ID {response_id} not found")
    
    selected_response.is_selected = True
    turn.active_response_id = response_uuid
    
    db.commit()
    
    return {"status": "success", "selected_response_id": response_id}