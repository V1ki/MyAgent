import pytest
import uuid
from fastapi import status

@pytest.fixture
def provider_id(client):
    """Create a test provider and return its ID."""
    response = client.post(
        "/providers/",
        json={
            "name": f"KeyTestProvider-{uuid.uuid4()}",
            "base_url": "https://api.key-test-provider.com"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()["id"]

def test_create_api_key(client, provider_id):
    """Test creating a new API key for a provider."""
    response = client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "TestKey",
            "key": "sk-test-key-12345678"
        }
    )
    print(response.json())
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["alias"] == "TestKey"
    assert "key_preview" in data
    assert data["provider_id"] == provider_id

def test_get_provider_api_keys(client, provider_id):
    """Test retrieving all API keys for a provider."""
    # Create some test API keys
    key_aliases = ["Key1", "Key2", "Key3"]
    for alias in key_aliases:
        client.post(
            f"/providers/{provider_id}/keys",
            json={
                "alias": alias,
                "key": f"sk-{alias.lower()}-12345678"
            }
        )
    
    # Retrieve all keys for the provider
    response = client.get(f"/providers/{provider_id}/keys")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3
    retrieved_aliases = [key["alias"] for key in data]
    for alias in key_aliases:
        assert alias in retrieved_aliases

def test_get_api_key_by_id(client, provider_id):
    """Test retrieving a specific API key by its ID."""
    # Create a test API key
    response = client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "GetByIDKey",
            "key": "sk-get-by-id-12345678"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    key_id = response.json()["id"]
    
    # Retrieve the key by ID
    response = client.get(f"/keys/{key_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["alias"] == "GetByIDKey"
    assert "key_preview" in data

def test_get_nonexistent_api_key(client):
    """Test that retrieving a non-existent API key returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/keys/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_api_key(client, provider_id):
    """Test updating an API key."""
    # Create a test API key
    response = client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "UpdateKey",
            "key": "sk-update-12345678"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    key_id = response.json()["id"]
    
    # Update the API key
    response = client.put(
        f"/keys/{key_id}",
        json={
            "alias": "UpdatedKey",
            "key": "sk-updated-87654321"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["alias"] == "UpdatedKey"
    
    # Verify the update by retrieving the key again
    response = client.get(f"/keys/{key_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["alias"] == "UpdatedKey"

def test_delete_api_key(client, provider_id):
    """Test deleting an API key."""
    # Create a test API key
    response = client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "DeleteKey",
            "key": "sk-delete-12345678"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    key_id = response.json()["id"]
    
    # Delete the API key
    response = client.delete(f"/keys/{key_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the key is gone
    response = client.get(f"/keys/{key_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_create_api_key_for_nonexistent_provider(client):
    """Test creating an API key for a non-existent provider."""
    non_existent_id = str(uuid.uuid4())
    response = client.post(
        f"/providers/{non_existent_id}/keys",
        json={
            "alias": "NonExistentProviderKey",
            "key": "sk-non-existent-12345678"
        }
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_api_keys_for_nonexistent_provider(client):
    """Test retrieving API keys for a non-existent provider."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/providers/{non_existent_id}/keys")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_partial_update_api_key(client, provider_id):
    """Test partially updating an API key (only updating the alias)."""
    # Create a test API key
    response = client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "PartialUpdateKey",
            "key": "sk-partial-update-12345678"
        }
    )
    key_id = response.json()["id"]
    
    # Update only the alias
    response = client.put(
        f"/keys/{key_id}",
        json={
            "alias": "PartiallyUpdatedKey"
        }
    )
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["alias"] == "PartiallyUpdatedKey"
    
    # The key should still be the same
    response = client.get(f"/keys/{key_id}")
    assert response.status_code == status.HTTP_200_OK