from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from sqlalchemy.sql import func

from app.models.provider import ModelProvider, ApiKey
from app.models.schemas import ModelProviderCreate, ModelProviderUpdate, ApiKeyCreate, ApiKeyUpdate

class ProviderService:
    @staticmethod
    def get_providers(db: Session, skip: int = 0, limit: int = 100) -> List[ModelProvider]:
        return db.query(ModelProvider).offset(skip).limit(limit).all()

    @staticmethod
    def get_provider(db: Session, provider_id: UUID) -> Optional[ModelProvider]:
        return db.query(ModelProvider).filter(ModelProvider.id == provider_id).first()

    @staticmethod
    def get_provider_by_name(db: Session, name: str) -> Optional[ModelProvider]:
        return db.query(ModelProvider).filter(ModelProvider.name == name).first()

    @staticmethod
    def create_provider(db: Session, provider: ModelProviderCreate) -> ModelProvider:
        # Create the provider
        db_provider = ModelProvider(
            name=provider.name,
            base_url=provider.base_url,
            description=provider.description,
            free_quota_type=provider.free_quota_type,
        )
        db.add(db_provider)
        db.commit()
        db.refresh(db_provider)
        
        # Add initial API key if provided
        if provider.initial_api_key:
            db_api_key = ApiKey(
                provider_id=db_provider.id,
                alias=provider.initial_api_key.alias,
                key=provider.initial_api_key.key
            )
            db.add(db_api_key)
            db.commit()
            db.refresh(db_provider)

        return db_provider

    @staticmethod
    def update_provider(db: Session, provider_id: UUID, provider: ModelProviderUpdate) -> Optional[ModelProvider]:
        db_provider = ProviderService.get_provider(db, provider_id)
        if db_provider is None:
            return None
            
        update_data = provider.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_provider, key, value)
            
        db.commit()
        db.refresh(db_provider)
        return db_provider

    @staticmethod
    def delete_provider(db: Session, provider_id: UUID) -> bool:
        db_provider = ProviderService.get_provider(db, provider_id)
        if db_provider is None:
            return False
            
        db.delete(db_provider)
        db.commit()
        return True


class ApiKeyService:
    @staticmethod
    def get_api_keys(db: Session, provider_id: UUID, skip: int = 0, limit: int = 100) -> List[ApiKey]:
        return db.query(ApiKey).filter(ApiKey.provider_id == provider_id).order_by(ApiKey.sort_order).offset(skip).limit(limit).all()

    @staticmethod
    def get_api_key(db: Session, api_key_id: UUID) -> Optional[ApiKey]:
        return db.query(ApiKey).filter(ApiKey.id == api_key_id).first()

    @staticmethod
    def create_api_key(db: Session, provider_id: UUID, api_key: ApiKeyCreate) -> Optional[ApiKey]:
        # Check if provider exists
        provider = ProviderService.get_provider(db, provider_id)
        if provider is None:
            return None
            
        # Get the maximum sort order for this provider
        max_sort_order = db.query(func.max(ApiKey.sort_order)).filter(ApiKey.provider_id == provider_id).scalar() or 0
        
        db_api_key = ApiKey(
            provider_id=provider_id,
            alias=api_key.alias,
            key=api_key.key,
            sort_order=max_sort_order + 1  # Add new key at the end
        )
        db.add(db_api_key)
        db.commit()
        db.refresh(db_api_key)
        return db_api_key

    @staticmethod
    def update_api_key(db: Session, api_key_id: UUID, api_key: ApiKeyUpdate) -> Optional[ApiKey]:
        db_api_key = ApiKeyService.get_api_key(db, api_key_id)
        if db_api_key is None:
            return None
            
        update_data = api_key.model_dump(exclude_unset=True)
        
        # Skip empty key strings - preserve the original key when empty string is provided
        if "key" in update_data and update_data["key"] == "":
            update_data.pop("key")
            
        for key, value in update_data.items():
            setattr(db_api_key, key, value)
            
        db.commit()
        db.refresh(db_api_key)
        return db_api_key

    @staticmethod
    def update_api_key_order(db: Session, provider_id: UUID, api_key_id: UUID, new_order: int) -> bool:
        """Update the sort order of an API key and reorder others accordingly."""
        db_api_key = ApiKeyService.get_api_key(db, api_key_id)
        if db_api_key is None or db_api_key.provider_id != provider_id:
            return False

        old_order = db_api_key.sort_order
        if old_order == new_order:
            return True

        if old_order < new_order:
            # Moving down - decrease order of keys in between
            db.query(ApiKey).filter(
                ApiKey.provider_id == provider_id,
                ApiKey.sort_order > old_order,
                ApiKey.sort_order <= new_order
            ).update({ApiKey.sort_order: ApiKey.sort_order - 1})
        else:
            # Moving up - increase order of keys in between
            db.query(ApiKey).filter(
                ApiKey.provider_id == provider_id,
                ApiKey.sort_order >= new_order,
                ApiKey.sort_order < old_order
            ).update({ApiKey.sort_order: ApiKey.sort_order + 1})

        db_api_key.sort_order = new_order
        db.commit()
        return True

    @staticmethod
    def delete_api_key(db: Session, api_key_id: UUID) -> bool:
        db_api_key = ApiKeyService.get_api_key(db, api_key_id)
        if db_api_key is None:
            return False
            
        db.delete(db_api_key)
        db.commit()
        return True
        
    @staticmethod
    def mask_api_key(key: str) -> str:
        """Return a masked version of the API key for display purposes."""
        if len(key) < 8:
            return "****"
        return key[:4] + "****" + key[-4:]

    @staticmethod
    def bulk_update_api_key_order(db: Session, orders: dict[UUID, int]) -> bool:
        """Bulk update the sort order of multiple API keys."""
        try:
            # Use SQLAlchemy's bulk_update_mappings for efficient updates
            db.bulk_update_mappings(
                ApiKey,
                [
                    {"id": key_id, "sort_order": order}
                    for key_id, order in orders.items()
                ]
            )
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error updating API key orders: {e}")
            return False