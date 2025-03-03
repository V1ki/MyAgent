import pytest
import uuid
from fastapi import status

def test_create_provider(client):
    """Test creating a new model provider."""
    # Create a provider without initial API key
    response = client.post(
        "/providers/",
        json={
            "name": "TestProvider",
            "base_url": "https://api.test-provider.com"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "TestProvider"
    assert data["base_url"] == "https://api.test-provider.com"
    assert "id" in data

def test_create_provider_with_initial_key(client):
    """Test creating a provider with an initial API key."""
    response = client.post(
        "/providers/",
        json={
            "name": "TestProviderWithKey",
            "base_url": "https://api.test-provider.com",
            "initial_api_key": {
                "alias": "DefaultKey",
                "key": "sk-test-key-12345678"
            }
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "TestProviderWithKey"
    
    # Check that the key was created by retrieving the provider details
    provider_id = data["id"]
    response = client.get(f"/providers/{provider_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "TestProviderWithKey"
    assert len(data["api_keys"]) == 1
    assert data["api_keys"][0]["alias"] == "DefaultKey"
    assert "key_preview" in data["api_keys"][0]

def test_create_duplicate_provider(client):
    """Test that creating a provider with a duplicate name fails."""
    # Create the first provider
    response = client.post(
        "/providers/",
        json={
            "name": "DuplicateTest",
            "base_url": "https://api.duplicate-test.com"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    
    # Attempt to create a second provider with the same name
    response = client.post(
        "/providers/",
        json={
            "name": "DuplicateTest",
            "base_url": "https://api.another-url.com"
        }
    )
    assert response.status_code == status.HTTP_409_CONFLICT

def test_get_all_providers(client):
    """Test retrieving all providers."""
    # Create some test providers
    for i in range(3):
        client.post(
            "/providers/",
            json={
                "name": f"Provider{i}",
                "base_url": f"https://api.provider{i}.com"
            }
        )
    
    # Retrieve all providers
    response = client.get("/providers/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 3
    assert any(p["name"] == "Provider0" for p in data)
    assert any(p["name"] == "Provider1" for p in data)
    assert any(p["name"] == "Provider2" for p in data)

def test_get_provider_by_id(client):
    """Test retrieving a provider by ID."""
    # Create a test provider
    response = client.post(
        "/providers/",
        json={
            "name": "GetByIDTest",
            "base_url": "https://api.get-by-id.com",
            "description": "Test provider for get by ID"
        }
    )
    provider_id = response.json()["id"]
    
    # Retrieve the provider by ID
    response = client.get(f"/providers/{provider_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "GetByIDTest"
    assert data["base_url"] == "https://api.get-by-id.com"
    assert data["description"] == "Test provider for get by ID"
    assert "api_keys" in data

def test_get_nonexistent_provider(client):
    """Test that retrieving a non-existent provider returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/providers/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_provider(client):
    """Test updating a provider."""
    # Create a test provider
    response = client.post(
        "/providers/",
        json={
            "name": "UpdateTest",
            "base_url": "https://api.update-test.com"
        }
    )
    provider_id = response.json()["id"]
    
    # Update the provider
    update_data = {
        "name": "UpdatedName",
        "description": "This provider was updated"
    }
    response = client.put(f"/providers/{provider_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "UpdatedName"
    assert data["description"] == "This provider was updated"
    # The base_url should not have changed
    assert data["base_url"] == "https://api.update-test.com"

def test_delete_provider(client):
    """Test deleting a provider."""
    # Create a test provider
    response = client.post(
        "/providers/",
        json={
            "name": "DeleteTest",
            "base_url": "https://api.delete-test.com"
        }
    )
    provider_id = response.json()["id"]
    
    # Delete the provider
    response = client.delete(f"/providers/{provider_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the provider is gone
    response = client.get(f"/providers/{provider_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_provider_with_keys(client):
    """Test deleting a provider that has API keys."""
    # Create a provider with an initial key
    response = client.post(
        "/providers/",
        json={
            "name": "DeleteWithKeysTest",
            "base_url": "https://api.delete-with-keys.com",
            "initial_api_key": {
                "alias": "InitialKey",
                "key": "sk-initial-12345678"
            }
        }
    )
    provider_id = response.json()["id"]
    
    # Add another API key
    client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "SecondKey",
            "key": "sk-second-12345678"
        }
    )
    
    # Delete the provider
    response = client.delete(f"/providers/{provider_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the provider is gone
    response = client.get(f"/providers/{provider_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_providers_with_api_key_count(client):
    """Test that the providers list endpoint returns the correct API key count."""
    # Create a provider with an initial key
    response = client.post(
        "/providers/",
        json={
            "name": "ProviderWithKeys",
            "base_url": "https://api.provider-with-keys.com",
            "initial_api_key": {
                "alias": "InitialKey",
                "key": "sk-initial-12345678"
            }
        }
    )
    provider_id = response.json()["id"]
    
    # Add another API key
    client.post(
        f"/providers/{provider_id}/keys",
        json={
            "alias": "SecondKey",
            "key": "sk-second-12345678"
        }
    )
    
    # Create another provider without keys
    client.post(
        "/providers/",
        json={
            "name": "ProviderWithoutKeys",
            "base_url": "https://api.provider-without-keys.com"
        }
    )
    
    # Get all providers and verify the API key counts
    response = client.get("/providers/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    provider_with_keys = next(p for p in data if p["name"] == "ProviderWithKeys")
    provider_without_keys = next(p for p in data if p["name"] == "ProviderWithoutKeys")
    
    assert provider_with_keys["api_keys_count"] == 2
    assert provider_without_keys["api_keys_count"] == 0