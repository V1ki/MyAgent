from sqlalchemy.orm import Session
from sqlalchemy import exc
from fastapi import HTTPException, status
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timedelta

from app.models.provider import ModelProvider, FreeQuota, FreeQuotaUsage, ApiKey, FreeQuotaType, ResetPeriod
from app.models.schemas import FreeQuotaCreate, FreeQuotaUpdate

class FreeQuotaService:
    @staticmethod
    def get_free_quota(db: Session, provider_id: UUID) -> Optional[FreeQuota]:
        """Get the free quota for a specific provider."""
        return db.query(FreeQuota).filter(FreeQuota.provider_id == provider_id).first()

    @staticmethod
    def create_free_quota(db: Session, provider_id: UUID, free_quota: FreeQuotaCreate) -> Optional[FreeQuota]:
        """Create a free quota for a provider. Will fail if one already exists."""
        db_free_quota = FreeQuota(
            provider_id=provider_id,
            model_implementation_id=free_quota.model_implementation_id,
            amount=free_quota.amount,
            reset_period=free_quota.reset_period
        )
        db.add(db_free_quota)
        db.commit()
        db.refresh(db_free_quota)
        return db_free_quota

    @staticmethod
    def update_free_quota(db: Session, provider_id: UUID, quota_id: UUID, free_quota: FreeQuotaUpdate) -> Optional[FreeQuota]:
        """Update an existing free quota."""
        db_free_quota = db.query(FreeQuota).filter(
            FreeQuota.id == quota_id,
            FreeQuota.provider_id == provider_id
        ).first()
        
        if not db_free_quota:
            return None
        
        # Update fields if provided
        if free_quota.amount is not None:
            db_free_quota.amount = free_quota.amount
        if free_quota.reset_period is not None:
            db_free_quota.reset_period = free_quota.reset_period
        if free_quota.model_implementation_id is not None:
            db_free_quota.model_implementation_id = free_quota.model_implementation_id
            
        db.commit()
        db.refresh(db_free_quota)
        return db_free_quota

    @staticmethod
    def delete_free_quota(db: Session, provider_id: UUID, quota_id: UUID) -> bool:
        """Delete a free quota."""
        db_free_quota = db.query(FreeQuota).filter(
            FreeQuota.id == quota_id,
            FreeQuota.provider_id == provider_id
        ).first()
        
        if db_free_quota:
            db.delete(db_free_quota)
            db.commit()
            return True
        return False

def get_free_quotas(db: Session, provider_id: UUID) -> Optional[FreeQuota]:
    """
    Get all free quotas for a provider
    """
    quotas = db.query(FreeQuota).filter(FreeQuota.provider_id == provider_id).all()
    if not quotas or len(quotas) == 0:
        # No free quotas found
        return None
    return quotas[0]  # Assuming one free quota per provider

def get_free_quota(db: Session, provider_id: UUID, free_quota_id: UUID) -> FreeQuota:
    """
    Get a specific free quota by ID
    """
    free_quota = db.query(FreeQuota).filter(
        FreeQuota.id == free_quota_id,
        FreeQuota.provider_id == provider_id
    ).first()
    
    if free_quota is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Free quota with id {free_quota_id} not found"
        )
    
    return free_quota

def create_free_quota(db: Session, provider_id: UUID, free_quota: FreeQuotaCreate) -> FreeQuota:
    """
    Create a new free quota for a provider
    """
    # Verify the provider exists
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    if not provider:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Provider with id {provider_id} not found"
        )
    
    # Verify provider has a free quota type
    if not provider.free_quota_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Provider does not have a free quota type configured"
        )
    
    # For PER_MODEL_TOKENS type, verify model_implementation_id is provided
    if provider.free_quota_type == FreeQuotaType.PER_MODEL_TOKENS and not free_quota.model_implementation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A model implementation ID is required for PER_MODEL_TOKENS free quota type"
        )
    
    # For other types, model_implementation_id should be None
    if provider.free_quota_type != FreeQuotaType.PER_MODEL_TOKENS and free_quota.model_implementation_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model implementation ID should not be provided for {provider.free_quota_type.value} free quota type"
        )
    
    # Create the new free quota
    db_free_quota = FreeQuota(
        provider_id=provider_id,
        model_implementation_id=free_quota.model_implementation_id,
        amount=free_quota.amount,
        reset_period=free_quota.reset_period
    )
    
    try:
        db.add(db_free_quota)
        db.commit()
        db.refresh(db_free_quota)
        return db_free_quota
    except exc.IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create free quota: {str(e)}"
        )

def update_free_quota(db: Session, provider_id: UUID, free_quota_id: UUID, free_quota_update: FreeQuotaUpdate) -> FreeQuota:
    """
    Update an existing free quota
    """
    db_free_quota = get_free_quota(db, provider_id, free_quota_id)
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    
    update_data = free_quota_update.dict(exclude_unset=True)
    
    # Validate model_implementation_id based on provider's free_quota_type
    if provider.free_quota_type == FreeQuotaType.PER_MODEL_TOKENS and "model_implementation_id" in update_data and update_data["model_implementation_id"] is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A model implementation ID is required for PER_MODEL_TOKENS free quota type"
        )
    
    if provider.free_quota_type != FreeQuotaType.PER_MODEL_TOKENS and "model_implementation_id" in update_data and update_data["model_implementation_id"] is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model implementation ID should not be provided for {provider.free_quota_type.value} free quota type"
        )
    
    # Update fields
    for key, value in update_data.items():
        setattr(db_free_quota, key, value)
    
    try:
        db.commit()
        db.refresh(db_free_quota)
        return db_free_quota
    except exc.IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update free quota: {str(e)}"
        )

def delete_free_quota(db: Session, provider_id: UUID, free_quota_id: UUID) -> None:
    """
    Delete a free quota
    """
    db_free_quota = get_free_quota(db, provider_id, free_quota_id)
    
    # Delete any associated usage records
    db.query(FreeQuotaUsage).filter(FreeQuotaUsage.free_quota_id == free_quota_id).delete()
    
    # Delete the free quota
    db.delete(db_free_quota)
    db.commit()

def get_free_quota_usage(db: Session, api_key_id: UUID, free_quota_id: UUID) -> Optional[FreeQuotaUsage]:
    """
    Get the usage record for a free quota and API key
    """
    return db.query(FreeQuotaUsage).filter(
        FreeQuotaUsage.api_key_id == api_key_id,
        FreeQuotaUsage.free_quota_id == free_quota_id
    ).first()

def create_or_update_usage(db: Session, api_key_id: UUID, free_quota_id: UUID, amount_used: float) -> FreeQuotaUsage:
    """
    Create or update a free quota usage record
    """
    # Verify the free quota and API key exist
    free_quota = db.query(FreeQuota).filter(FreeQuota.id == free_quota_id).first()
    if not free_quota:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Free quota with id {free_quota_id} not found"
        )
    
    api_key = db.query(ApiKey).filter(ApiKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"API key with id {api_key_id} not found"
        )
    
    # Check if usage record already exists
    db_usage = get_free_quota_usage(db, api_key_id, free_quota_id)
    
    # Calculate reset dates if applicable
    next_reset_date = None
    if free_quota.reset_period != ResetPeriod.NEVER:
        now = datetime.now()
        if free_quota.reset_period == ResetPeriod.DAILY:
            next_reset_date = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif free_quota.reset_period == ResetPeriod.WEEKLY:
            days_until_next_week = 7 - now.weekday()
            next_reset_date = (now + timedelta(days=days_until_next_week)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif free_quota.reset_period == ResetPeriod.MONTHLY:
            if now.month == 12:
                next_reset_date = datetime(now.year + 1, 1, 1)
            else:
                next_reset_date = datetime(now.year, now.month + 1, 1)
        elif free_quota.reset_period == ResetPeriod.YEARLY:
            next_reset_date = datetime(now.year + 1, 1, 1)
    
    # Create or update the usage record
    if not db_usage:
        db_usage = FreeQuotaUsage(
            api_key_id=api_key_id,
            free_quota_id=free_quota_id,
            used_amount=amount_used,
            last_reset_date=datetime.now(),
            next_reset_date=next_reset_date
        )
        db.add(db_usage)
    else:
        # Check if it's time to reset
        if db_usage.next_reset_date and db_usage.next_reset_date <= datetime.now():
            db_usage.used_amount = amount_used
            db_usage.last_reset_date = datetime.now()
            db_usage.next_reset_date = next_reset_date
        else:
            db_usage.used_amount += amount_used
    
    db.commit()
    db.refresh(db_usage)
    return db_usage

def get_remaining_quota(db: Session, api_key_id: UUID, provider_id: UUID, model_implementation_id: Optional[UUID] = None) -> float:
    """
    Calculate the remaining free quota for an API key
    
    Returns the remaining amount (money or tokens) based on the provider's free quota type
    """
    # Get the provider and its free quota type
    provider = db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()
    if not provider or not provider.free_quota_type:
        return 0
    
    # Find the relevant free quotas based on provider's free quota type
    if provider.free_quota_type == FreeQuotaType.PER_MODEL_TOKENS and not model_implementation_id:
        return 0  # Need model ID for per-model quotas
    
    if provider.free_quota_type == FreeQuotaType.PER_MODEL_TOKENS:
        free_quotas = db.query(FreeQuota).filter(
            FreeQuota.provider_id == provider_id,
            FreeQuota.model_implementation_id == model_implementation_id
        ).all()
    else:
        free_quotas = db.query(FreeQuota).filter(
            FreeQuota.provider_id == provider_id,
            FreeQuota.model_implementation_id.is_(None)
        ).all()
    
    if not free_quotas:
        return 0
    
    # Calculate remaining quota
    remaining = 0
    for quota in free_quotas:
        # Get usage for this quota
        usage = get_free_quota_usage(db, api_key_id, quota.id)
        
        # Reset quota if needed
        if usage and usage.next_reset_date and usage.next_reset_date <= datetime.now():
            usage.used_amount = 0
            usage.last_reset_date = datetime.now()
            
            # Calculate next reset date
            now = datetime.now()
            if quota.reset_period == ResetPeriod.DAILY:
                usage.next_reset_date = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            elif quota.reset_period == ResetPeriod.WEEKLY:
                days_until_next_week = 7 - now.weekday()
                usage.next_reset_date = (now + timedelta(days=days_until_next_week)).replace(hour=0, minute=0, second=0, microsecond=0)
            elif quota.reset_period == ResetPeriod.MONTHLY:
                if now.month == 12:
                    usage.next_reset_date = datetime(now.year + 1, 1, 1)
                else:
                    usage.next_reset_date = datetime(now.year, now.month + 1, 1)
            elif quota.reset_period == ResetPeriod.YEARLY:
                usage.next_reset_date = datetime(now.year + 1, 1, 1)
            
            db.commit()
            db.refresh(usage)
        
        # Add remaining quota
        used = usage.used_amount if usage else 0
        remaining += max(0, quota.amount - used)
    
    return remaining