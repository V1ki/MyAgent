from sqlalchemy import Column, DateTime, Float, String, ForeignKey, Enum,Boolean, Integer, ARRAY,CheckConstraint, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
import enum

from app.db.database import Base

class FreeQuotaType(str, enum.Enum):
    CREDIT = "CREDIT"                     # 赠送金额
    SHARED_TOKENS = "SHARED_TOKENS"       # 共享的赠送Token数
    PER_MODEL_TOKENS = "PER_MODEL_TOKENS" # 每个模型独立的赠送Token数
    
    def __str__(self):
        return self.value
    
    def __json__(self):
        return self.value

class ResetPeriod(str, enum.Enum):
    NEVER = "NEVER"     # 永不重置
    DAILY = "DAILY"     # 每天重置
    WEEKLY = "WEEKLY"   # 每周重置
    MONTHLY = "MONTHLY" # 每月重置
    YEARLY = "YEARLY"   # 每年重置
    
    def __str__(self):
        return self.value
    
    def __json__(self):
        return self.value

class ModelProvider(Base):
    __tablename__ = "model_providers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, index=True)
    base_url = Column(String, nullable=False)
    description = Column(String(200), nullable=True)
    free_quota_type = Column(Enum(FreeQuotaType), nullable=True)  # 免费额度类型
    
    # Relationships
    api_keys = relationship("ApiKey", back_populates="provider", cascade="all, delete-orphan")
    model_implementations = relationship("ModelImplementation", back_populates="provider", cascade="all, delete-orphan")
    free_quota = relationship("FreeQuota", back_populates="provider", uselist=False, cascade="all, delete-orphan")
    
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
    free_quota_usage = relationship("FreeQuotaUsage", back_populates="api_key", uselist=False, cascade="all, delete-orphan")
    
    
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
    free_quota = relationship("FreeQuota", back_populates="model_implementation", uselist=False)
    
    def __repr__(self):
        return f"<ModelImplementation(id={self.id}, model_id='{self.model_id}', provider_model_id='{self.provider_model_id}')>"
    
    
class FreeQuota(Base):
    """免费额度配置"""
    __tablename__ = "free_quotas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), ForeignKey("model_providers.id"), nullable=False)
    model_implementation_id = Column(UUID(as_uuid=True), ForeignKey("model_implementations.id"), nullable=True)
    amount = Column(Float, nullable=False)  # 金额或token数
    reset_period = Column(Enum(ResetPeriod), nullable=False, default=ResetPeriod.NEVER)
    
    # Add unique constraint to ensure one quota per provider
    __table_args__ = (
        CheckConstraint('amount > 0', name='check_positive_amount'),
        UniqueConstraint('provider_id', name='uq_provider_free_quota'),
    )
    
    # Relationships
    provider = relationship("ModelProvider", back_populates="free_quota")
    model_implementation = relationship("ModelImplementation", back_populates="free_quota")
    usages = relationship("FreeQuotaUsage", back_populates="free_quota", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<FreeQuota(id={self.id}, provider_id='{self.provider_id}', amount={self.amount})>"

class FreeQuotaUsage(Base):
    """免费额度使用情况"""
    __tablename__ = "free_quota_usages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=False)
    free_quota_id = Column(UUID(as_uuid=True), ForeignKey("free_quotas.id"), nullable=False)
    used_amount = Column(Float, nullable=False, default=0)  # 已使用的金额或token数
    last_reset_date = Column(DateTime(timezone=True), nullable=True)
    next_reset_date = Column(DateTime(timezone=True), nullable=True)  # 下次重置时间
    
    # Relationships
    api_key = relationship("ApiKey", back_populates="free_quota_usage")
    free_quota = relationship("FreeQuota", back_populates="usages")
    
    def __repr__(self):
        return f"<FreeQuotaUsage(id={self.id}, api_key_id='{self.api_key_id}', used_amount={self.used_amount})>"
