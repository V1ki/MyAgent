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
        if not v:
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

