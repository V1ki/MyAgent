from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

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
            description=provider.description
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
        return db.query(ApiKey).filter(ApiKey.provider_id == provider_id).offset(skip).limit(limit).all()

    @staticmethod
    def get_api_key(db: Session, api_key_id: UUID) -> Optional[ApiKey]:
        return db.query(ApiKey).filter(ApiKey.id == api_key_id).first()

    @staticmethod
    def create_api_key(db: Session, provider_id: UUID, api_key: ApiKeyCreate) -> Optional[ApiKey]:
        # Check if provider exists
        provider = ProviderService.get_provider(db, provider_id)
        if provider is None:
            return None
            
        db_api_key = ApiKey(
            provider_id=provider_id,
            alias=api_key.alias,
            key=api_key.key
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
        for key, value in update_data.items():
            setattr(db_api_key, key, value)
            
        db.commit()
        db.refresh(db_api_key)
        return db_api_key

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