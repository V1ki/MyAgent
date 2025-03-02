from sqlalchemy import Column, String, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.db.database import Base

class ModelProvider(Base):
    __tablename__ = "model_providers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    base_url = Column(String, nullable=False)
    description = Column(String(200), nullable=True)
    
    # Relationships
    api_keys = relationship("ApiKey", back_populates="provider", cascade="all, delete-orphan")
    model_implementations = relationship("ModelImplementation", back_populates="provider", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ModelProvider(id={self.id}, name='{self.name}', base_url='{self.base_url}')>"

class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("model_providers.id"), nullable=False)
    alias = Column(String, nullable=False)
    key = Column(String, nullable=False)
    
    # Relationship back to provider
    provider = relationship("ModelProvider", back_populates="api_keys")
    
    def __repr__(self):
        return f"<ApiKey(id={self.id}, alias='{self.alias}', provider_id='{self.provider_id}')>"

class ModelImplementation(Base):
    __tablename__ = "model_implementations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("model_providers.id"), nullable=False)
    model_id = Column(String, nullable=False)
    provider_model_id = Column(String, nullable=False)
    version = Column(String, nullable=True)
    context_window = Column(Integer, nullable=True)
    pricing_info = Column(JSONB, nullable=True)
    is_available = Column(Boolean, default=True)
    custom_parameters = Column(JSONB, nullable=True)
    
    # Relationship back to provider
    provider = relationship("ModelProvider", back_populates="model_implementations")
    
    def __repr__(self):
        return f"<ModelImplementation(id={self.id}, model_id='{self.model_id}', provider_model_id='{self.provider_model_id}')>"