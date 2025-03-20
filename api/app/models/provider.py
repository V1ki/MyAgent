from sqlalchemy import Column, DateTime, String, ForeignKey, Boolean, Integer, ARRAY
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
    usages = relationship("ApiKeyUsage", back_populates="api_key", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ApiKey(id={self.id}, alias='{self.alias}', provider_id='{self.provider_id}')>"


class ApiKeyUsage(Base):
    __tablename__ = "api_key_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    model_implementation_id = Column(UUID(as_uuid=True), ForeignKey("model_implementations.id"), nullable=False)
    prompt_tokens = Column(Integer, nullable=False)  # 输入 token 数
    completion_tokens = Column(Integer, nullable=False) # 输出 token 数
    total_tokens = Column(Integer, nullable=False)  # 总 token 数
    prompt_tokens_details = Column(JSONB, nullable=True)
    completion_tokens_details = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    
    # Relationship back to api key
    api_key = relationship("ApiKey", back_populates="usages")
    model_implementation = relationship("ModelImplementation", back_populates="usages")
    
    def __repr__(self):
        return f"<ApiKeyUsage(id={self.id}, api_key_id='{self.api_key_id}', timestamp='{self.timestamp}')>"


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
    provider_model_id = Column(String, nullable=False) # 供应商 提供的模型 ID,用于调用
    version = Column(String, nullable=True)
    context_window = Column(Integer, nullable=True)
    pricing_info = Column(JSONB, nullable=True)
    is_available = Column(Boolean, default=True)
    custom_parameters = Column(JSONB, nullable=True)
    
    # Relationships
    provider = relationship("ModelProvider", back_populates="model_implementations")
    model = relationship("Model", back_populates="implementations")
    usages = relationship("ApiKeyUsage", back_populates="model_implementation", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ModelImplementation(id={self.id}, model_id='{self.model_id}', provider_model_id='{self.provider_model_id}')>"