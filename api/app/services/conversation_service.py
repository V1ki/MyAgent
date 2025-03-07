from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
import uuid

from app.models.conversation import Conversation, ConversationTurn, UserInputVersion, ModelResponse, ParameterPreset
from app.models.schemas import ConversationCreate, ConversationUpdate, ConversationTurnCreate, ConversationTurnUpdate
from app.models.schemas import UserInputVersionCreate, ParameterPresetCreate, ParameterPresetUpdate, ModelResponseCreate

class ConversationService:
    @staticmethod
    def get_conversations(db: Session, skip: int = 0, limit: int = 100) -> List[Conversation]:
        """Get all conversations with pagination."""
        return db.query(Conversation).offset(skip).limit(limit).all()

    @staticmethod
    def get_conversation(db: Session, conversation_id: UUID) -> Optional[Conversation]:
        """Get a specific conversation by ID."""
        return db.query(Conversation).filter(Conversation.id == conversation_id).first()

    @staticmethod
    def create_conversation(db: Session, conversation: ConversationCreate) -> Conversation:
        """Create a new conversation."""
        db_conversation = Conversation(
            id=uuid.uuid4(),
            title=conversation.title,
            system_prompt=conversation.system_prompt
        )
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def update_conversation(db: Session, conversation_id: UUID, conversation: ConversationUpdate) -> Optional[Conversation]:
        """Update an existing conversation."""
        db_conversation = ConversationService.get_conversation(db, conversation_id)
        if db_conversation is None:
            return None
            
        update_data = conversation.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_conversation, key, value)
            
        db.commit()
        db.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def delete_conversation(db: Session, conversation_id: UUID) -> bool:
        """Delete a conversation."""
        db_conversation = ConversationService.get_conversation(db, conversation_id)
        if db_conversation is None:
            return False
            
        db.delete(db_conversation)
        db.commit()
        return True

class ConversationTurnService:
    @staticmethod
    def get_conversation_turns(db: Session, conversation_id: UUID, skip: int = 0, limit: int = 100) -> List[ConversationTurn]:
        """Get all turns for a conversation with pagination."""
        return db.query(ConversationTurn).filter(ConversationTurn.conversation_id == conversation_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_conversation_turn(db: Session, turn_id: UUID) -> Optional[ConversationTurn]:
        """Get a specific conversation turn by ID."""
        return db.query(ConversationTurn).filter(ConversationTurn.id == turn_id).first()

    @staticmethod
    def create_conversation_turn(db: Session, conversation_id: UUID, turn_data: ConversationTurnCreate) -> ConversationTurn:
        """Create a new turn in a conversation."""
        db_turn = ConversationTurn(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            user_input=turn_data.user_input,
            model_parameters=turn_data.model_parameters,
            is_deleted=False
        )
        db.add(db_turn)
        db.commit()
        db.refresh(db_turn)
        
        # Also create an initial user input version
        user_input_version = UserInputVersion(
            id=uuid.uuid4(),
            turn_id=db_turn.id,
            content=turn_data.user_input,
            model_parameters=turn_data.model_parameters,
            is_current=True
        )
        db.add(user_input_version)
        db.commit()
        
        return db_turn

    @staticmethod
    def update_conversation_turn(db: Session, turn_id: UUID, turn_data: ConversationTurnUpdate) -> Optional[ConversationTurn]:
        """Update an existing turn."""
        db_turn = ConversationTurnService.get_conversation_turn(db, turn_id)
        if db_turn is None:
            return None
            
        update_data = turn_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_turn, key, value)
            
        db.commit()
        db.refresh(db_turn)
        return db_turn

    @staticmethod
    def delete_conversation_turn(db: Session, turn_id: UUID) -> Optional[ConversationTurn]:
        """Soft delete a turn (mark as deleted)."""
        db_turn = ConversationTurnService.get_conversation_turn(db, turn_id)
        if db_turn is None:
            return None
            
        db_turn.is_deleted = True
        db.commit()
        db.refresh(db_turn)
        return db_turn

    @staticmethod
    def set_active_response(db: Session, turn_id: UUID, response_id: UUID) -> Optional[ConversationTurn]:
        """Set a specific response as the active response for a turn."""
        db_turn = ConversationTurnService.get_conversation_turn(db, turn_id)
        if db_turn is None:
            return None
            
        db_turn.active_response_id = response_id
        db.commit()
        db.refresh(db_turn)
        return db_turn

class UserInputVersionService:
    @staticmethod
    def get_input_versions(db: Session, turn_id: UUID) -> List[UserInputVersion]:
        """Get all versions of a user input for a specific turn."""
        return db.query(UserInputVersion).filter(UserInputVersion.turn_id == turn_id).all()

    @staticmethod
    def get_input_version(db: Session, version_id: UUID) -> Optional[UserInputVersion]:
        """Get a specific version by ID."""
        return db.query(UserInputVersion).filter(UserInputVersion.id == version_id).first()

    @staticmethod
    def create_input_version(db: Session, turn_id: UUID, version_data: UserInputVersionCreate) -> UserInputVersion:
        """Create a new version of a user input and set it as current."""
        # First set all existing versions as not current
        db.query(UserInputVersion).filter(UserInputVersion.turn_id == turn_id).update({"is_current": False})
        
        # Create the new version as current
        db_version = UserInputVersion(
            id=uuid.uuid4(),
            turn_id=turn_id,
            content=version_data.content,
            model_parameters=version_data.model_parameters,
            is_current=True
        )
        db.add(db_version)
        
        # Update the turn's user_input to match the new version
        db_turn = db.query(ConversationTurn).filter(ConversationTurn.id == turn_id).first()
        if db_turn:
            db_turn.user_input = version_data.content
            if version_data.model_parameters:
                db_turn.model_parameters = version_data.model_parameters
        
        db.commit()
        db.refresh(db_version)
        return db_version

    @staticmethod
    def set_current_version(db: Session, version_id: UUID) -> Optional[UserInputVersion]:
        """Set a specific version as the current version and make other versions not current."""
        version = db.query(UserInputVersion).filter(UserInputVersion.id == version_id).first()
        if version is None:
            return None
        
        # First set all versions for this turn as not current
        db.query(UserInputVersion).filter(UserInputVersion.turn_id == version.turn_id).update({"is_current": False})
        
        # Then set the requested version as current
        version.is_current = True
        
        # Update the turn's user_input to match this version
        db_turn = db.query(ConversationTurn).filter(ConversationTurn.id == version.turn_id).first()
        if db_turn:
            db_turn.user_input = version.content
            if version.model_parameters:
                db_turn.model_parameters = version.model_parameters
        
        db.commit()
        db.refresh(version)
        return version

class ModelResponseService:
    @staticmethod
    def get_model_responses(db: Session, turn_id: UUID) -> List[ModelResponse]:
        """Get all model responses for a specific turn."""
        return db.query(ModelResponse).filter(ModelResponse.turn_id == turn_id).all()

    @staticmethod
    def get_model_response(db: Session, response_id: UUID) -> Optional[ModelResponse]:
        """Get a specific model response by ID."""
        return db.query(ModelResponse).filter(ModelResponse.id == response_id).first()

    @staticmethod
    def create_model_response(db: Session, turn_id: UUID, response_data: ModelResponseCreate) -> ModelResponse:
        """Create a new model response for a turn."""
        db_response = ModelResponse(
            id=uuid.uuid4(),
            turn_id=turn_id,
            model_implementation_id=response_data.model_implementation_id,
            content=response_data.content,
            is_selected=response_data.is_selected,
            is_deleted=False,
            response_metadata=response_data.response_metadata,
            input_version_id=response_data.input_version_id
        )
        db.add(db_response)
        
        # If this is the first response or is marked as selected, set it as the active response
        if response_data.is_selected:
            # First unselect any other responses
            db.query(ModelResponse).filter(
                ModelResponse.turn_id == turn_id,
                ModelResponse.id != db_response.id
            ).update({"is_selected": False})
            
            # Set this as the active response for the turn
            turn = db.query(ConversationTurn).filter(ConversationTurn.id == turn_id).first()
            if turn:
                turn.active_response_id = db_response.id
        
        db.commit()
        db.refresh(db_response)
        return db_response

    @staticmethod
    def set_selected_response(db: Session, response_id: UUID) -> Optional[ModelResponse]:
        """Set a specific response as selected for context and unselect others."""
        response = db.query(ModelResponse).filter(ModelResponse.id == response_id).first()
        if response is None:
            return None
        
        # First set all responses for this turn as not selected
        db.query(ModelResponse).filter(ModelResponse.turn_id == response.turn_id).update({"is_selected": False})
        
        # Then set the requested response as selected
        response.is_selected = True
        db.commit()
        db.refresh(response)
        return response

    @staticmethod
    def delete_model_response(db: Session, response_id: UUID) -> Optional[ModelResponse]:
        """Soft delete a model response (mark as deleted)."""
        response = ModelResponseService.get_model_response(db, response_id)
        if response is None:
            return None
            
        response.is_deleted = True
        
        # If this was the active response for the turn, clear that reference
        turn = db.query(ConversationTurn).filter(
            ConversationTurn.id == response.turn_id,
            ConversationTurn.active_response_id == response_id
        ).first()
        if turn:
            turn.active_response_id = None
        
        db.commit()
        db.refresh(response)
        return response

class ParameterPresetService:
    @staticmethod
    def get_parameter_presets(db: Session, skip: int = 0, limit: int = 100) -> List[ParameterPreset]:
        """Get all parameter presets with pagination."""
        return db.query(ParameterPreset).offset(skip).limit(limit).all()

    @staticmethod
    def get_parameter_preset(db: Session, preset_id: UUID) -> Optional[ParameterPreset]:
        """Get a specific parameter preset by ID."""
        return db.query(ParameterPreset).filter(ParameterPreset.id == preset_id).first()

    @staticmethod
    def create_parameter_preset(db: Session, preset: ParameterPresetCreate) -> ParameterPreset:
        """Create a new parameter preset."""
        db_preset = ParameterPreset(
            id=uuid.uuid4(),
            name=preset.name,
            description=preset.description,
            parameters=preset.parameters,
            model_implementation_id=preset.model_implementation_id
        )
        db.add(db_preset)
        db.commit()
        db.refresh(db_preset)
        return db_preset

    @staticmethod
    def update_parameter_preset(db: Session, preset_id: UUID, preset: ParameterPresetUpdate) -> Optional[ParameterPreset]:
        """Update an existing parameter preset."""
        db_preset = ParameterPresetService.get_parameter_preset(db, preset_id)
        if db_preset is None:
            return None
            
        update_data = preset.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_preset, key, value)
            
        db.commit()
        db.refresh(db_preset)
        return db_preset

    @staticmethod
    def delete_parameter_preset(db: Session, preset_id: UUID) -> bool:
        """Delete a parameter preset."""
        db_preset = ParameterPresetService.get_parameter_preset(db, preset_id)
        if db_preset is None:
            return False
            
        db.delete(db_preset)
        db.commit()
        return True