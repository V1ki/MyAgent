from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import ModelProviderCreate, ModelProviderRead, ModelProviderDetailedRead, ModelProviderUpdate, ModelProviderListRead, OrderUpdate
from app.services.provider_service import ProviderService, ApiKeyService
from app.services import free_quota_service
from app.models.provider import ApiKey

router = APIRouter(prefix="/providers", tags=["providers"])

@router.get("/", response_model=List[ModelProviderListRead])
def get_providers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all model providers with pagination and API key counts."""
    providers = ProviderService.get_providers(db, skip=skip, limit=limit)
    
    # Transform the providers to include API key count
    result = []
    for provider in providers:
        provider_data = ModelProviderListRead.model_validate(provider)
        provider_data.api_keys_count = len(provider.api_keys)
        result.append(provider_data)
    
    return result

@router.get("/{provider_id}", response_model=ModelProviderDetailedRead)
def get_provider(
    provider_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific model provider by ID, including API keys and free quotas."""
    provider = ProviderService.get_provider(db, provider_id)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    # Get free quotas for this provider
    free_quota = free_quota_service.get_free_quotas(db, provider_id)
    
    # Create response with masked API keys
    response = ModelProviderDetailedRead.model_validate(provider)
    response.api_keys_count = len(provider.api_keys)
    response.api_keys = [
        {
            "id": key.id,
            "provider_id": key.provider_id,
            "alias": key.alias,
            "key_preview": ApiKeyService.mask_api_key(key.key),
            "sort_order": key.sort_order
        }
        for key in provider.api_keys
    ]
    # Sort API keys by sort_order
    response.api_keys = sorted(response.api_keys, key=lambda x: x["sort_order"])
    
    response.free_quota = free_quota
    
    return response

@router.post("/", response_model=ModelProviderRead, status_code=status.HTTP_201_CREATED)
def create_provider(
    provider: ModelProviderCreate,
    db: Session = Depends(get_db)
):
    """Create a new model provider, optionally with an initial API key."""
    # Check if a provider with the same name already exists
    existing_provider = ProviderService.get_provider_by_name(db, provider.name)
    if existing_provider:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Provider with name '{provider.name}' already exists"
        )
        
    return ProviderService.create_provider(db, provider)

@router.put("/{provider_id}", response_model=ModelProviderRead)
def update_provider(
    provider_id: UUID,
    provider: ModelProviderUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing model provider."""
    # Check if the provider exists
    db_provider = ProviderService.get_provider(db, provider_id)
    if db_provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    # Check if updating name to one that already exists
    if provider.name is not None and provider.name != db_provider.name:
        existing_provider = ProviderService.get_provider_by_name(db, provider.name)
        if existing_provider and existing_provider.id != provider_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Provider with name '{provider.name}' already exists"
            )
    
    updated_provider = ProviderService.update_provider(db, provider_id, provider)
    return updated_provider

@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(
    provider_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a model provider and all associated API keys."""
    # Check if the provider exists
    db_provider = ProviderService.get_provider(db, provider_id)
    if db_provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    success = ProviderService.delete_provider(db, provider_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete provider"
        )
    
    return None  # 204 No Content response doesn't include a body

@router.put("/{provider_id}/orders", status_code=status.HTTP_200_OK)
def update_provider_api_keys_order(
    provider_id: UUID,
    order_update: OrderUpdate,
    db: Session = Depends(get_db)
):
    """Update the sort order of multiple API keys at once."""
    # Check if the provider exists
    provider = ProviderService.get_provider(db, provider_id)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    # Verify all API keys belong to this provider
    api_keys = db.query(ApiKey).filter(
        ApiKey.id.in_(order_update.orders.keys()),
        ApiKey.provider_id == provider_id
    ).all()
    
    if len(api_keys) != len(order_update.orders):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some API keys were not found or do not belong to this provider"
        )
    
    # Update all API keys at once
    success = ApiKeyService.bulk_update_api_key_order(db, order_update.orders)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update API key orders"
        )
    
    return {"message": "API key orders updated successfully"}