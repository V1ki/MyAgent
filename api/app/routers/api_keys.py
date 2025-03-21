from fastapi import APIRouter, Depends, HTTPException, Query, status, Path
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import ApiKeyCreate, ApiKeyRead, ApiKeyUpdate, ApiKeyReadWithMaskedKey
from app.services.provider_service import ApiKeyService, ProviderService

router = APIRouter(tags=["api_keys"])

@router.get("/providers/{provider_id}/keys", response_model=List[ApiKeyReadWithMaskedKey])
def get_provider_api_keys(
    provider_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all API keys for a specific provider with pagination."""
    # Check if provider exists
    provider = ProviderService.get_provider(db, provider_id)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    api_keys = ApiKeyService.get_api_keys(db, provider_id, skip=skip, limit=limit)
    
    # Return masked API keys for security
    masked_keys = []
    for key in api_keys:
        masked_keys.append({
            "id": key.id,
            "provider_id": key.provider_id,
            "alias": key.alias,
            "key_preview": ApiKeyService.mask_api_key(key.key)
        })
    
    return masked_keys

@router.post("/providers/{provider_id}/keys", response_model=ApiKeyReadWithMaskedKey, status_code=status.HTTP_201_CREATED)
def create_api_key(
    provider_id: UUID,
    api_key: ApiKeyCreate,
    db: Session = Depends(get_db)
):
    """Create a new API key for a provider."""
    # Check if provider exists
    provider = ProviderService.get_provider(db, provider_id)
    if provider is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    db_api_key = ApiKeyService.create_api_key(db, provider_id, api_key)
    
    # Return masked API key for security
    return {
        "id": db_api_key.id,
        "provider_id": db_api_key.provider_id,
        "alias": db_api_key.alias,
        "key_preview": ApiKeyService.mask_api_key(db_api_key.key)
    }

@router.get("/providers/{provider_id}/keys/{api_key_id}", response_model=ApiKeyReadWithMaskedKey)
def get_api_key(
    api_key_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific API key by ID."""
    api_key = ApiKeyService.get_api_key(db, api_key_id)
    if api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key with ID {api_key_id} not found"
        )
    
    # Return masked API key for security
    return {
        "id": api_key.id,
        "provider_id": api_key.provider_id,
        "alias": api_key.alias,
        "key_preview": ApiKeyService.mask_api_key(api_key.key)
    }

@router.put("/providers/{provider_id}/keys/{api_key_id}", response_model=ApiKeyReadWithMaskedKey)
def update_api_key(
    api_key_id: UUID,
    api_key: ApiKeyUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing API key."""
    # Check if the API key exists
    db_api_key = ApiKeyService.get_api_key(db, api_key_id)
    if db_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key with ID {api_key_id} not found"
        )
    
    updated_api_key = ApiKeyService.update_api_key(db, api_key_id, api_key)
    
    # Return masked API key for security
    return {
        "id": updated_api_key.id,
        "provider_id": updated_api_key.provider_id,
        "alias": updated_api_key.alias,
        "key_preview": ApiKeyService.mask_api_key(updated_api_key.key)
    }

@router.delete("/providers/{provider_id}/keys/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    api_key_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete an API key."""
    # Check if the API key exists
    db_api_key = ApiKeyService.get_api_key(db, api_key_id)
    if db_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key with ID {api_key_id} not found"
        )
    
    success = ApiKeyService.delete_api_key(db, api_key_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete API key"
        )
    
    return None  # 204 No Content response doesn't include a body