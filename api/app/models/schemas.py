from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import List, Optional, Dict, Any, Union
from uuid import UUID
from datetime import datetime

from app.models.provider import FreeQuotaType, ResetPeriod

# API Key schemas
class ApiKeyBase(BaseModel):
    alias: str = Field(..., description="A human-readable alias for the API key")
    key: str = Field(..., description="The actual API key value")
    sort_order: int = Field(0, description="Sort order for drag-and-drop functionality")
    
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
    sort_order: Optional[int] = None

class ApiKeyRead(ApiKeyBase):
    id: UUID
    provider_id: UUID
    
    model_config = ConfigDict(from_attributes=True)


class ApiKeyReadWithMaskedKey(BaseModel):
    id: UUID
    provider_id: UUID
    alias: str
    key_preview: str  = None # This will be a masked version of the key
    sort_order: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class OrderUpdate(BaseModel):
    orders: dict[UUID, int] = Field(..., description="Dictionary of API key IDs and their new sort orders")


# Model Provider schemas
class ModelProviderBase(BaseModel):
    name: str = Field(..., description="Name of the model provider")
    base_url: str = Field(..., description="Base URL for the provider's API")
    description: Optional[str] = Field(None, max_length=200, description="Optional description")
    free_quota_type: Optional[FreeQuotaType] = None
    model_config = ConfigDict(from_attributes=True)


class ModelProviderCreate(ModelProviderBase):
    initial_api_key: Optional[ApiKeyCreate] = Field(None, description="Optional initial API key for the provider")


class ModelProviderUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[str] = None
    description: Optional[str] = None
    free_quota_type: Optional[FreeQuotaType] = None


class ModelProviderRead(ModelProviderBase):
    id: UUID
    
    model_config = ConfigDict(from_attributes=True)

class ModelProviderListRead(ModelProviderRead):
    api_keys_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)

class ModelProviderDetailedRead(ModelProviderRead):
    api_keys: List[ApiKeyReadWithMaskedKey] = []
    api_keys_count: int = 0
    free_quota: Optional['FreeQuota'] = None
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


# Free Quota Schemas
class FreeQuotaBase(BaseModel):
    model_implementation_id: Optional[UUID] = None
    amount: float = Field(..., gt=0, description="Amount of the free quota (money or tokens)")
    reset_period: ResetPeriod = Field(default=ResetPeriod.NEVER, description="Reset period for the quota")

class FreeQuotaCreate(FreeQuotaBase):
    pass

class FreeQuotaUpdate(BaseModel):
    model_implementation_id: Optional[UUID] = None
    amount: Optional[float] = Field(None, gt=0)
    reset_period: Optional[ResetPeriod] = None

class FreeQuota(FreeQuotaBase):
    id: UUID
    provider_id: UUID

    model_config = ConfigDict(from_attributes=True)

class FreeQuotaUsageBase(BaseModel):
    used_amount: float = Field(default=0, ge=0)
    last_reset_date: Optional[datetime] = None
    next_reset_date: Optional[datetime] = None

class FreeQuotaUsageCreate(FreeQuotaUsageBase):
    free_quota_id: UUID
    api_key_id: UUID

class FreeQuotaUsage(FreeQuotaUsageBase):
    id: UUID
    free_quota_id: UUID
    api_key_id: UUID

    model_config = ConfigDict(from_attributes=True)

