from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import FreeQuota, FreeQuotaCreate, FreeQuotaUpdate
from app.services.free_quota_service import FreeQuotaService
from app.services.provider_service import ProviderService

router = APIRouter(tags=["free_quotas"])

@router.get("/providers/{provider_id}/free-quota", response_model=FreeQuota)
def get_provider_free_quota(
    provider_id: UUID,
    db: Session = Depends(get_db)
):
    """Get the free quota configuration for a provider."""
    # Verify provider exists
    provider = ProviderService.get_provider(db, provider_id)
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    # Get the free quota
    free_quota = FreeQuotaService.get_free_quota(db, provider_id)
    if not free_quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No free quota found for provider {provider_id}"
        )
    
    return free_quota

@router.post("/providers/{provider_id}/free-quota", response_model=FreeQuota, status_code=status.HTTP_201_CREATED)
def create_provider_free_quota(
    provider_id: UUID,
    free_quota: FreeQuotaCreate,
    db: Session = Depends(get_db)
):
    """Create a free quota configuration for a provider."""
    # Verify provider exists and has free quota type set
    provider = ProviderService.get_provider(db, provider_id)
    if not provider:
        print(f"Provider with ID {provider_id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with ID {provider_id} not found"
        )
    
    if not provider.free_quota_type:
        print(f"Provider {provider_id} does not have a free quota type set")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider must have a free quota type set before creating a free quota"
        )
    
    # Check if provider already has a free quota
    existing_quota = FreeQuotaService.get_free_quota(db, provider_id)
    if existing_quota:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Provider {provider_id} already has a free quota configured"
        )
    
    # Create new free quota
    db_free_quota = FreeQuotaService.create_free_quota(db, provider_id, free_quota)
    if not db_free_quota:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create free quota"
        )
    
    return db_free_quota

@router.put("/providers/{provider_id}/free-quota/{quota_id}", response_model=FreeQuota)
def update_provider_free_quota(
    provider_id: UUID,
    quota_id: UUID,
    free_quota: FreeQuotaUpdate,
    db: Session = Depends(get_db)
):
    """Update a provider's free quota configuration."""
    # Update the free quota
    db_free_quota = FreeQuotaService.update_free_quota(db, provider_id, quota_id, free_quota)
    if not db_free_quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Free quota with ID {quota_id} not found for provider {provider_id}"
        )
    
    return db_free_quota

@router.delete("/providers/{provider_id}/free-quota/{quota_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider_free_quota(
    provider_id: UUID,
    quota_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a provider's free quota configuration."""
    # Delete the free quota
    success = FreeQuotaService.delete_free_quota(db, provider_id, quota_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Free quota with ID {quota_id} not found for provider {provider_id}"
        )
    
    return None