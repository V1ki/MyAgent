from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import (
    ConversationCreate, ConversationRead, ConversationDetailedRead, ConversationUpdate,
    ConversationTurnCreate, ConversationTurnRead, ConversationTurnDetailedRead, ConversationTurnUpdate,
    UserInputVersionCreate, UserInputVersionRead, 
    ParameterPresetCreate, ParameterPresetRead, ParameterPresetUpdate,
    ModelResponseCreate, ModelResponseRead
)
from app.services.conversation_service import (
    ConversationService, ConversationTurnService, UserInputVersionService, 
    ModelResponseService, ParameterPresetService
)

router = APIRouter(prefix="/conversations", tags=["conversations"])

# Parameter preset endpoints
@router.get("/parameter-presets", response_model=List[ParameterPresetRead])
def get_parameter_presets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all parameter presets with pagination."""
    return ParameterPresetService.get_parameter_presets(db, skip=skip, limit=limit)

@router.post("/parameter-presets", response_model=ParameterPresetRead, status_code=status.HTTP_201_CREATED)
def create_parameter_preset(
    preset: ParameterPresetCreate,
    db: Session = Depends(get_db)
):
    """Create a new parameter preset."""
    return ParameterPresetService.create_parameter_preset(db, preset)

@router.get("/parameter-presets/{preset_id}", response_model=ParameterPresetRead)
def get_parameter_preset(
    preset_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific parameter preset by ID."""
    preset = ParameterPresetService.get_parameter_preset(db, preset_id)
    if preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parameter preset with ID {preset_id} not found"
        )
    return preset

@router.put("/parameter-presets/{preset_id}", response_model=ParameterPresetRead)
def update_parameter_preset(
    preset_id: UUID,
    preset: ParameterPresetUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing parameter preset."""
    updated_preset = ParameterPresetService.update_parameter_preset(db, preset_id, preset)
    if updated_preset is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parameter preset with ID {preset_id} not found"
        )
    return updated_preset

@router.delete("/parameter-presets/{preset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parameter_preset(
    preset_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a parameter preset."""
    if not ParameterPresetService.delete_parameter_preset(db, preset_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Parameter preset with ID {preset_id} not found"
        )
    return None

# Conversation endpoints
@router.get("/", response_model=List[ConversationRead])
def get_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all conversations with pagination."""
    return ConversationService.get_conversations(db, skip=skip, limit=limit)

@router.post("/", response_model=ConversationRead, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conversation: ConversationCreate,
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    return ConversationService.create_conversation(db, conversation)

@router.get("/{conversation_id}", response_model=ConversationDetailedRead)
def get_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific conversation by ID, including turns."""
    conversation = ConversationService.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    return conversation

@router.put("/{conversation_id}", response_model=ConversationRead)
def update_conversation(
    conversation_id: UUID,
    conversation: ConversationUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing conversation."""
    updated_conversation = ConversationService.update_conversation(db, conversation_id, conversation)
    if updated_conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    return updated_conversation

@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a conversation."""
    if not ConversationService.delete_conversation(db, conversation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    return None

# Conversation turn endpoints
@router.get("/{conversation_id}/turns", response_model=List[ConversationTurnRead])
def get_conversation_turns(
    conversation_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all turns for a conversation with pagination."""
    conversation = ConversationService.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    return ConversationTurnService.get_conversation_turns(db, conversation_id, skip=skip, limit=limit)

@router.post("/{conversation_id}/turns", response_model=ConversationTurnRead, status_code=status.HTTP_201_CREATED)
def create_conversation_turn(
    conversation_id: UUID,
    turn: ConversationTurnCreate,
    db: Session = Depends(get_db)
):
    """Create a new turn in a conversation."""
    conversation = ConversationService.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    return ConversationTurnService.create_conversation_turn(db, conversation_id, turn)

@router.get("/{conversation_id}/turns/{turn_id}", response_model=ConversationTurnDetailedRead)
def get_conversation_turn(
    conversation_id: UUID,
    turn_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific turn by ID, including responses and input versions."""
    conversation = ConversationService.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    return turn

@router.put("/{conversation_id}/turns/{turn_id}", response_model=ConversationTurnRead)
def update_conversation_turn(
    conversation_id: UUID,
    turn_id: UUID,
    turn: ConversationTurnUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing turn."""
    conversation = ConversationService.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    
    updated_turn = ConversationTurnService.update_conversation_turn(db, turn_id, turn)
    if updated_turn is None or updated_turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    return updated_turn

@router.delete("/{conversation_id}/turns/{turn_id}", response_model=ConversationTurnRead)
def delete_conversation_turn(
    conversation_id: UUID,
    turn_id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete a turn (mark as deleted)."""
    conversation = ConversationService.get_conversation(db, conversation_id)
    if conversation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with ID {conversation_id} not found"
        )
    
    if not ConversationTurnService.delete_conversation_turn(db, turn_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    return None

# User input version endpoints
@router.get("/{conversation_id}/turns/{turn_id}/versions", response_model=List[UserInputVersionRead])
def get_input_versions(
    conversation_id: UUID,
    turn_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all versions of a user input for a specific turn."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    return UserInputVersionService.get_input_versions(db, turn_id)

@router.post("/{conversation_id}/turns/{turn_id}/versions", response_model=UserInputVersionRead, status_code=status.HTTP_201_CREATED)
def create_input_version(
    conversation_id: UUID,
    turn_id: UUID,
    version: UserInputVersionCreate,
    db: Session = Depends(get_db)
):
    """Create a new version of a user input."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    return UserInputVersionService.create_input_version(db, turn_id, version)

@router.get("/{conversation_id}/turns/{turn_id}/versions/{version_id}", response_model=UserInputVersionRead)
def get_input_version(
    conversation_id: UUID,
    turn_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific version of a user input."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    version = UserInputVersionService.get_input_version(db, version_id)
    if version is None or version.turn_id != turn_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version with ID {version_id} not found for turn {turn_id}"
        )
    
    return version

@router.put("/{conversation_id}/turns/{turn_id}/versions/{version_id}/set-current", response_model=UserInputVersionRead)
def set_current_version(
    conversation_id: UUID,
    turn_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db)
):
    """Set a specific version as the current version."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    version = UserInputVersionService.set_current_version(db, version_id)
    if version is None or version.turn_id != turn_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Version with ID {version_id} not found for turn {turn_id}"
        )
    
    return version

# Model response endpoints
@router.post("/{conversation_id}/turns/{turn_id}/responses", response_model=ModelResponseRead, status_code=status.HTTP_201_CREATED)
def create_model_response(
    conversation_id: UUID,
    turn_id: UUID,
    response: ModelResponseCreate,
    db: Session = Depends(get_db)
):
    """Create a new model response for a turn."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    return ModelResponseService.create_model_response(db, turn_id, response)

@router.put("/{conversation_id}/turns/{turn_id}/responses/{response_id}/select", response_model=ModelResponseRead)
def select_response(
    conversation_id: UUID,
    turn_id: UUID,
    response_id: UUID,
    db: Session = Depends(get_db)
):
    """Select a specific response as the context for future turns."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    response = ModelResponseService.set_selected_response(db, response_id)
    if response is None or response.turn_id != turn_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with ID {response_id} not found for turn {turn_id}"
        )
    
    # Also set this response as the active response for the turn
    ConversationTurnService.set_active_response(db, turn_id, response_id)
    
    return response

@router.delete("/{conversation_id}/turns/{turn_id}/responses/{response_id}", response_model=ModelResponseRead)
def delete_model_response(
    conversation_id: UUID,
    turn_id: UUID,
    response_id: UUID,
    db: Session = Depends(get_db)
):
    """Soft delete a model response (mark as deleted)."""
    turn = ConversationTurnService.get_conversation_turn(db, turn_id)
    if turn is None or turn.conversation_id != conversation_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Turn with ID {turn_id} not found in conversation {conversation_id}"
        )
    
    if not ModelResponseService.delete_model_response(db, response_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response with ID {response_id} not found for turn {turn_id}"
        )
    
    return None