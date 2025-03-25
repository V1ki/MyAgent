import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid
from typing import Dict, List
from datetime import datetime

from app.main import app
from app.models.provider import ModelProvider, FreeQuota, FreeQuotaUsage, FreeQuotaType, ResetPeriod
from app.models.schemas import FreeQuotaCreate, ModelProviderCreate

client = TestClient(app)

@pytest.fixture
def test_provider(db: Session) -> Dict:
    """Create a test provider with free quota type"""
    
    provider_data = ModelProviderCreate(
        name=f"Test Provider {uuid.uuid4()}",
        base_url="https://test.provider.com",
        description="Test provider for free quota tests",
        free_quota_type=FreeQuotaType.CREDIT
    )
    
    # Create the provider using the API
    response = client.post("/providers/", json=provider_data.model_dump())
    assert response.status_code == 201
    provider_id = response.json()["id"]
    
    return {
        "id": provider_id,
        "free_quota_type": FreeQuotaType.CREDIT.value
    }

@pytest.fixture
def test_provider_shared_tokens(db: Session) -> Dict:
    """Create a test provider with SHARED_TOKENS free quota type"""
    provider_data = ModelProviderCreate(
        name=f"Shared Tokens Provider {uuid.uuid4()}",
        base_url="https://shared.tokens.com",
        description="Test provider for shared tokens",
        free_quota_type=FreeQuotaType.SHARED_TOKENS
    )
    
    # Create the provider using the API
    response = client.post("/providers/", json=provider_data.model_dump())
    assert response.status_code == 201
    provider_id = response.json()["id"]
    
    return {
        "id": provider_id,
        "free_quota_type": FreeQuotaType.SHARED_TOKENS.value
    }

@pytest.fixture
def test_provider_per_model(db: Session) -> Dict:
    """Create a test provider with PER_MODEL_TOKENS free quota type"""
    provider_data = ModelProviderCreate(
        name=f"Per Model Provider {uuid.uuid4()}",
        base_url="https://per.model.com",
        description="Test provider for per-model tokens",
        free_quota_type=FreeQuotaType.PER_MODEL_TOKENS
    )
    
    # Create the provider using the API
    response = client.post("/providers/", json=provider_data.model_dump())
    assert response.status_code == 201
    provider_id = response.json()["id"]
    
    # Create a model implementation for this provider (needed for PER_MODEL_TOKENS)
    # This would need to set up a model implementation via the models API
    # For now, we'll just return the provider info
    
    return {
        "id": provider_id,
        "free_quota_type": FreeQuotaType.PER_MODEL_TOKENS.value
    }

def test_create_free_quota(test_provider: Dict):
    """Test creating a free quota"""
    # Create credit type free quota
    free_quota_data = {
        "amount": 100.0,
        "reset_period": ResetPeriod.MONTHLY.value
    }
    
    response = client.post(
        f"/providers/{test_provider['id']}/free-quota/", 
        json=free_quota_data
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 100.0
    assert data["reset_period"] == ResetPeriod.MONTHLY.value
    assert data["provider_id"] == test_provider["id"]
    assert data["model_implementation_id"] is None  # No model ID for credit type

def test_create_shared_tokens_quota(test_provider_shared_tokens: Dict):
    """Test creating a shared tokens quota"""
    free_quota_data = {
        "amount": 1000,  # 1000 tokens
        "reset_period": ResetPeriod.WEEKLY.value
    }
    
    response = client.post(
        f"/providers/{test_provider_shared_tokens['id']}/free-quota/", 
        json=free_quota_data
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 1000
    assert data["reset_period"] == ResetPeriod.WEEKLY.value
    assert data["provider_id"] == test_provider_shared_tokens["id"]
    assert data["model_implementation_id"] is None

def test_get_free_quotas(test_provider: Dict):
    """Test getting free quotas for a provider"""
    # First, create a couple of free quotas
    quota1 = {
        "amount": 50.0,
        "reset_period": ResetPeriod.MONTHLY.value
    }
    
    quota2 = {
        "amount": 100.0,
        "reset_period": ResetPeriod.YEARLY.value
    }
    
    response = client.post(f"/providers/{test_provider['id']}/free-quota/", json=quota1)
    assert response.status_code == 201
    
    response = client.post(f"/providers/{test_provider['id']}/free-quota/", json=quota2)
    assert response.status_code == 409
    
    # Get all quotas for the provider
    response = client.get(f"/providers/{test_provider['id']}/free-quota/")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that our quotas are in the list
    assert data["amount"] == 50.0

def test_update_free_quota(test_provider: Dict):
    """Test updating a free quota"""
    # Create a quota
    quota = {
        "amount": 75.0,
        "reset_period": ResetPeriod.MONTHLY.value
    }
    
    create_response = client.post(f"/providers/{test_provider['id']}/free-quota/", json=quota)
    assert create_response.status_code == 201
    quota_id = create_response.json()["id"]
    
    # Update the quota
    update_data = {
        "amount": 150.0,
        "reset_period": ResetPeriod.YEARLY.value
    }
    
    update_response = client.put(
        f"/providers/{test_provider['id']}/free-quota/{quota_id}", 
        json=update_data
    )
    
    assert update_response.status_code == 200
    updated_data = update_response.json()
    assert updated_data["amount"] == 150.0
    assert updated_data["reset_period"] == ResetPeriod.YEARLY.value
    assert updated_data["id"] == quota_id

def test_delete_free_quota(test_provider: Dict):
    """Test deleting a free quota"""
    # Create a quota
    quota = {
        "amount": 200.0,
        "reset_period": ResetPeriod.DAILY.value
    }
    
    create_response = client.post(f"/providers/{test_provider['id']}/free-quota/", json=quota)
    assert create_response.status_code == 201
    quota_id = create_response.json()["id"]
    
    # Delete the quota
    delete_response = client.delete(f"/providers/{test_provider['id']}/free-quota/{quota_id}")
    assert delete_response.status_code == 204
    
    # Verify it's gone
    get_response = client.get(f"/providers/{test_provider['id']}/free-quota")
    assert get_response.status_code == 404

def test_provider_includes_free_quotas(test_provider: Dict):
    """Test that provider details include free quotas"""
    # Create a quota
    quota = {
        "amount": 100.0,
        "reset_period": ResetPeriod.MONTHLY.value
    }
    
    client.post(f"/providers/{test_provider['id']}/free-quota/", json=quota)
    
    # Get the provider details
    response = client.get(f"/providers/{test_provider['id']}")
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that free_quota is included
    assert "free_quota" in data
    assert data["free_quota"] is not None
    
    # Check free_quota_type is set
    assert data["free_quota_type"] == test_provider["free_quota_type"]