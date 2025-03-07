from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, DateTime, Text, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime, timezone
from app.db.database import Base

class Conversation(Base):
    """
    Model for storing chat conversations
    """
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Nullable for now, can be linked to a user system later
    system_prompt = Column(Text, nullable=True)
    
    # Relationships
    turns = relationship("ConversationTurn", back_populates="conversation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, title='{self.title}')>"

class ConversationTurn(Base):
    """
    Model for storing individual turns (question-answer pairs) in a conversation
    """
    __tablename__ = "conversation_turns"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    user_input = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    modified_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    is_deleted = Column(Boolean, default=False)
    model_parameters = Column(JSONB, nullable=True)
    active_response_id = Column(UUID(as_uuid=True), ForeignKey("model_responses.id"), nullable=True)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="turns")
    responses = relationship("ModelResponse", back_populates="turn", 
                            primaryjoin="ConversationTurn.id==ModelResponse.turn_id",
                            cascade="all, delete-orphan")
    input_versions = relationship("UserInputVersion", back_populates="turn", cascade="all, delete-orphan")
    active_response = relationship("ModelResponse", foreign_keys=[active_response_id], 
                                  primaryjoin="ConversationTurn.active_response_id==ModelResponse.id")
    
    def __repr__(self):
        return f"<ConversationTurn(id={self.id}, conversation_id='{self.conversation_id}')>"

class UserInputVersion(Base):
    """
    Model for storing different versions of user input for a conversation turn
    """
    __tablename__ = "user_input_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    turn_id = Column(UUID(as_uuid=True), ForeignKey("conversation_turns.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    model_parameters = Column(JSONB, nullable=True)
    is_current = Column(Boolean, default=True)
    
    # Relationships
    turn = relationship("ConversationTurn", back_populates="input_versions")
    responses = relationship("ModelResponse", back_populates="input_version")
    
    def __repr__(self):
        return f"<UserInputVersion(id={self.id}, turn_id='{self.turn_id}', is_current={self.is_current})>"

class ModelResponse(Base):
    """
    Model for storing responses from AI models
    """
    __tablename__ = "model_responses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    turn_id = Column(UUID(as_uuid=True), ForeignKey("conversation_turns.id"), nullable=False)
    model_implementation_id = Column(UUID(as_uuid=True), ForeignKey("model_implementations.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    is_selected = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    response_metadata = Column(JSONB, nullable=True)  # Renamed from 'metadata'
    input_version_id = Column(UUID(as_uuid=True), ForeignKey("user_input_versions.id"), nullable=True)
    
    # Relationships
    turn = relationship("ConversationTurn", back_populates="responses", 
                       foreign_keys=[turn_id],
                       primaryjoin="ModelResponse.turn_id==ConversationTurn.id")
    model_implementation = relationship("ModelImplementation")
    input_version = relationship("UserInputVersion", back_populates="responses")
    
    def __repr__(self):
        return f"<ModelResponse(id={self.id}, turn_id='{self.turn_id}', model_implementation_id='{self.model_implementation_id}')>"

class ModelParameters(Base):
    """
    Model for storing model parameters used for generation
    """
    __tablename__ = "model_parameters"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    temperature = Column(Float, nullable=True)
    top_p = Column(Float, nullable=True)
    max_tokens = Column(Integer, nullable=True)
    presence_penalty = Column(Float, nullable=True)
    frequency_penalty = Column(Float, nullable=True)
    stop_sequences = Column(JSONB, nullable=True)
    model_specific_params = Column(JSONB, nullable=True)
    
    def __repr__(self):
        return f"<ModelParameters(id={self.id}, temperature={self.temperature}, top_p={self.top_p})>"

class ParameterPreset(Base):
    """
    Model for storing named parameter presets that users can reuse
    """
    __tablename__ = "parameter_presets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Nullable for now, can be linked to a user system later
    parameters = Column(JSONB, nullable=False)
    model_implementation_id = Column(UUID(as_uuid=True), ForeignKey("model_implementations.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    model_implementation = relationship("ModelImplementation")
    
    def __repr__(self):
        return f"<ParameterPreset(id={self.id}, name='{self.name}')>"

class ChatPreference(Base):
    """
    Model for storing user preferences for the chat interface
    """
    __tablename__ = "chat_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=True)  # Nullable for now, can be linked to a user system later
    default_model_implementations = Column(JSONB, nullable=True)  # Store list of model implementation IDs
    default_parameters = Column(JSONB, nullable=True)
    stream_responses = Column(Boolean, default=True)
    theme = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<ChatPreference(id={self.id}, user_id='{self.user_id}')>"