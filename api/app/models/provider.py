from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, ARRAY
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

class Model(Base):
    __tablename__ = "models"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    capabilities = Column(ARRAY(String), nullable=False)
    family = Column(String, nullable=False)
    
    # Relationship to implementations
    implementations = relationship("ModelImplementation", back_populates="model", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Model(id={self.id}, name='{self.name}', family='{self.family}')>"

class ModelImplementation(Base):
    __tablename__ = "model_implementations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("model_providers.id"), nullable=False)
    model_id = Column(UUID(as_uuid=True), ForeignKey("models.id"), nullable=False)  # 添加了外键关联
    provider_model_id = Column(String, nullable=False)
    version = Column(String, nullable=True)
    context_window = Column(Integer, nullable=True)
    pricing_info = Column(JSONB, nullable=True)
    is_available = Column(Boolean, default=True)
    custom_parameters = Column(JSONB, nullable=True)
    
    # Relationships
    provider = relationship("ModelProvider", back_populates="model_implementations")
    model = relationship("Model", back_populates="implementations")
    
    def __repr__(self):
        return f"<ModelImplementation(id={self.id}, model_id='{self.model_id}', provider_model_id='{self.provider_model_id}')>"