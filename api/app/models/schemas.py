from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from datetime import datetime

# API Key schemas
class ApiKeyBase(BaseModel):
    alias: str = Field(..., description="A human-readable alias for the API key")
    key: str = Field(..., description="The actual API key value")
    
    @field_validator('key')
    def validate_key_format(cls, v):
        # Very basic validation - could be enhanced based on provider-specific patterns
        if not v or len(v) < 8:
            raise ValueError("API key must be at least 8 characters long")
        return v


class ApiKeyCreate(ApiKeyBase):
    pass


class ApiKeyUpdate(BaseModel):
    alias: Optional[str] = None
    key: Optional[str] = None

class ApiKeyRead(ApiKeyBase):
    id: UUID
    provider_id: UUID
    
    model_config = ConfigDict(from_attributes=True)


class ApiKeyReadWithMaskedKey(BaseModel):
    id: UUID
    provider_id: UUID
    alias: str
    key_preview: str  = None # This will be a masked version of the key
    
    model_config = ConfigDict(from_attributes=True)


# Model Provider schemas
class ModelProviderBase(BaseModel):
    name: str = Field(..., description="Name of the model provider")
    base_url: str = Field(..., description="Base URL for the provider's API")
    description: Optional[str] = Field(None, max_length=200, description="Optional description")


class ModelProviderCreate(ModelProviderBase):
    initial_api_key: Optional[ApiKeyCreate] = Field(None, description="Optional initial API key for the provider")


class ModelProviderUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    description: Optional[str] = None


class ModelProviderRead(ModelProviderBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class ModelProviderListRead(ModelProviderRead):
    api_keys_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class ModelProviderDetailedRead(ModelProviderRead):
    api_keys: List[ApiKeyReadWithMaskedKey] = []
    
    model_config = ConfigDict(from_attributes=True)


# Model Implementation schemas
class ModelImplementationBase(BaseModel):
    provider_id: UUID = Field(..., description="Provider ID that implements this model")
    model_id: UUID = Field(..., description="Internal model identifier")
    provider_model_id: str = Field(..., description="Model ID as known by the provider")
    version: Optional[str] = None
    context_window: Optional[int] = None
    pricing_info: Optional[Dict[str, Any]] = None
    is_available: bool = True
    custom_parameters: Optional[Dict[str, Any]] = None


class ModelImplementationCreate(ModelImplementationBase):
    pass


class ModelImplementationUpdate(BaseModel):
    model_id: Optional[str] = None
    provider_model_id: Optional[str] = None
    version: Optional[str] = None
    context_window: Optional[int] = None
    pricing_info: Optional[Dict[str, Any]] = None
    is_available: Optional[bool] = None
    custom_parameters: Optional[Dict[str, Any]] = None


class ModelImplementationRead(ModelImplementationBase):
    id: UUID
    provider_id: UUID
    
    model_config = ConfigDict(from_attributes=True)


# Model schemas
class ModelCreate(BaseModel):
    name: str = Field(..., description="Name of the model")
    description: Optional[str] = Field(None, description="Description of the model")
    capabilities: List[str] = Field(..., description="List of model capabilities")
    family: str = Field(..., description="Model family (e.g., GPT-4, Claude, Gemini)")

class ModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    capabilities: Optional[List[str]] = None
    family: Optional[str] = None

class ModelRead(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    capabilities: List[str]
    family: str

    model_config = ConfigDict(from_attributes=True)

class ModelDetailedRead(ModelRead):
    implementations: List['ModelImplementationRead'] = []

    model_config = ConfigDict(from_attributes=True)

class ModelListRead(ModelRead):
    implementations_count: int = 0

    model_config = ConfigDict(from_attributes=True)

# Model Parameters schemas
class ModelParametersBase(BaseModel):
    temperature: Optional[float] = Field(0.7, ge=0, le=2, description="Controls randomness of the output")
    top_p: Optional[float] = Field(1.0, ge=0, le=1, description="Controls diversity via nucleus sampling")
    max_tokens: Optional[int] = Field(1000, gt=0, description="Maximum number of tokens to generate")
    presence_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0, description="Penalty for repeating tokens")
    frequency_penalty: Optional[float] = Field(0.0, ge=-2.0, le=2.0, description="Penalty for repeating tokens based on frequency")
    stop_sequences: Optional[List[str]] = Field(None, description="List of sequences that stop generation")
    model_specific_params: Optional[Dict[str, Any]] = Field(None, description="Model-specific parameters")

class ModelParametersCreate(ModelParametersBase):
    pass

class ModelParametersUpdate(ModelParametersBase):
    pass

class ModelParametersRead(ModelParametersBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)

# Parameter Preset schemas
class ParameterPresetBase(BaseModel):
    name: str = Field(..., description="Preset name")
    description: Optional[str] = Field(None, description="Preset description")
    parameters: Dict[str, Any] = Field(..., description="Parameter values")
    model_implementation_id: Optional[UUID] = Field(None, description="Specific model implementation this preset is for")

class ParameterPresetCreate(ParameterPresetBase):
    pass

class ParameterPresetUpdate(ParameterPresetBase):
    name: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None

class ParameterPresetRead(ParameterPresetBase):
    id: UUID
    user_id: Optional[UUID] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# User Input Version schemas
class UserInputVersionBase(BaseModel):
    content: str = Field(..., description="User input content")
    model_parameters: Optional[Dict[str, Any]] = Field(None, description="Parameters for this version")
    is_current: bool = Field(True, description="Whether this is the current active version")

class UserInputVersionCreate(UserInputVersionBase):
    pass

class UserInputVersionUpdate(BaseModel):
    content: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None
    is_current: Optional[bool] = None

class UserInputVersionRead(UserInputVersionBase):
    id: UUID
    turn_id: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

# Model Response schemas
class ModelResponseBase(BaseModel):
    content: str = Field(..., description="Model response content")
    is_selected: bool = Field(False, description="Whether this response is selected for context")
    response_metadata: Optional[Dict[str, Any]] = Field(None, description="Response metadata")

class ModelResponseCreate(ModelResponseBase):
    turn_id: UUID = Field(..., description="ID of the conversation turn")
    model_implementation_id: UUID = Field(..., description="ID of the model implementation")
    input_version_id: Optional[UUID] = Field(None, description="ID of the input version this response is for")

class ModelResponseUpdate(BaseModel):
    is_selected: Optional[bool] = None
    is_deleted: Optional[bool] = None

class ModelResponseRead(ModelResponseBase):
    id: UUID
    turn_id: UUID
    model_implementation_id: UUID
    created_at: datetime
    is_deleted: bool
    input_version_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class ModelResponseDetailedRead(ModelResponseRead):
    model_implementation: 'ModelImplementationRead'
    
    model_config = ConfigDict(from_attributes=True)

# Conversation Turn schemas
class ConversationTurnBase(BaseModel):
    user_input: str = Field(..., description="User input for this turn")
    model_parameters: Optional[Dict[str, Any]] = Field(None, description="Parameters for this turn")

class ConversationTurnCreate(ConversationTurnBase):
    conversation_id: UUID = Field(..., description="ID of the conversation this turn belongs to")

class ConversationTurnUpdate(BaseModel):
    user_input: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None
    active_response_id: Optional[UUID] = None
    is_deleted: Optional[bool] = None

class ConversationTurnRead(ConversationTurnBase):
    id: UUID
    conversation_id: UUID
    created_at: datetime
    modified_at: datetime
    active_response_id: Optional[UUID] = None
    is_deleted: bool
    
    model_config = ConfigDict(from_attributes=True)

class ConversationTurnDetailedRead(ConversationTurnRead):
    responses: List[ModelResponseRead] = []
    input_versions: List[UserInputVersionRead] = []
    
    model_config = ConfigDict(from_attributes=True)

# Conversation schemas
class ConversationBase(BaseModel):
    title: str = Field(..., description="Title of the conversation")
    system_prompt: Optional[str] = Field(None, description="System prompt for the conversation")

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    system_prompt: Optional[str] = None

class ConversationRead(ConversationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    user_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)

class ConversationDetailedRead(ConversationRead):
    turns: List[ConversationTurnRead] = []
    
    model_config = ConfigDict(from_attributes=True)

# Chat Preference schemas
class ChatPreferenceBase(BaseModel):
    default_model_implementations: Optional[List[UUID]] = Field(None, description="Default model implementation IDs")
    default_parameters: Optional[Dict[str, Any]] = Field(None, description="Default parameters")
    stream_responses: bool = Field(True, description="Whether to stream responses")
    theme: Optional[str] = Field(None, description="UI theme preference")

class ChatPreferenceCreate(ChatPreferenceBase):
    pass

class ChatPreferenceUpdate(ChatPreferenceBase):
    default_model_implementations: Optional[List[UUID]] = None
    default_parameters: Optional[Dict[str, Any]] = None
    stream_responses: Optional[bool] = None
    theme: Optional[str] = None

class ChatPreferenceRead(ChatPreferenceBase):
    id: UUID
    user_id: Optional[UUID] = None
    
    model_config = ConfigDict(from_attributes=True)