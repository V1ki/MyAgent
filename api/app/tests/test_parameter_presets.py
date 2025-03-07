import pytest
import uuid
from fastapi import status

def test_create_parameter_preset(client):
    """Test creating a new parameter preset."""
    response = client.post(
        "/conversations/parameter-presets",
        json={
            "name": "Test Preset",
            "description": "A test parameter preset",
            "parameters": {
                "temperature": 0.8,
                "top_p": 0.95,
                "max_tokens": 2000,
                "presence_penalty": 0.2,
                "frequency_penalty": 0.3
            }
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Test Preset"
    assert data["description"] == "A test parameter preset"
    assert data["parameters"]["temperature"] == 0.8
    assert data["parameters"]["top_p"] == 0.95
    assert data["parameters"]["max_tokens"] == 2000
    assert "id" in data
    assert "created_at" in data

def test_create_preset_with_model_specific_params(client):
    """Test creating a preset with model-specific parameters."""
    # First create a model implementation to reference
    model_response = client.post(
        "/models/",
        json={
            "name": "Test Model",
            "description": "A test model for parameter presets",
            "capabilities": ["text-generation"],
            "family": "Test Family"
        }
    )
    model_id = model_response.json()["id"]
    
    # Create a provider
    provider_response = client.post(
        "/providers/",
        json={
            "name": f"Parameter Test Provider",
            "base_url": "https://api.parameter-test.com"
        }
    )
    provider_id = provider_response.json()["id"]
    
    # Create a model implementation
    impl_response = client.post(
        f"/models/{model_id}/implementations",
        json={
            "provider_id": provider_id,
            "model_id": model_id,
            "provider_model_id": "test-model-v1",
            "version": "1.0",
            "context_window": 4096,
            "is_available": True
        }
    )
    model_implementation_id = impl_response.json()["id"]
    
    # Create a parameter preset with model implementation reference
    response = client.post(
        "/conversations/parameter-presets",
        json={
            "name": "Model Specific Preset",
            "description": "Preset for specific model",
            "parameters": {
                "temperature": 0.5,
                "model_specific_params": {
                    "top_k": 40,
                    "repetition_penalty": 1.2
                }
            },
            "model_implementation_id": model_implementation_id
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Model Specific Preset"
    assert data["parameters"]["temperature"] == 0.5
    assert data["parameters"]["model_specific_params"]["top_k"] == 40
    assert data["model_implementation_id"] == model_implementation_id

def test_get_all_parameter_presets(client):
    """Test retrieving all parameter presets."""
    # Create several test presets
    preset_names = ["Preset 1", "Preset 2", "Preset 3"]
    
    for name in preset_names:
        client.post(
            "/conversations/parameter-presets",
            json={
                "name": name,
                "parameters": {
                    "temperature": 0.7
                }
            }
        )
    
    # Retrieve all presets
    response = client.get("/conversations/parameter-presets")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # There should be at least the presets we created, plus any default ones
    assert len(data) >= len(preset_names)
    
    # Verify that all created presets are present
    names = [preset["name"] for preset in data]
    for name in preset_names:
        assert name in names

def test_get_parameter_presets_pagination(client):
    """Test pagination when retrieving parameter presets."""
    # Create 5 test presets
    for i in range(5):
        client.post(
            "/conversations/parameter-presets",
            json={
                "name": f"Pagination Preset {i}",
                "parameters": {
                    "temperature": 0.7 + (i * 0.1)
                }
            }
        )
    
    # Test limit parameter
    response = client.get("/conversations/parameter-presets?limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    
    # Test skip parameter
    response = client.get("/conversations/parameter-presets?skip=2&limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2

def test_get_parameter_preset_by_id(client):
    """Test retrieving a specific parameter preset by ID."""
    # Create a test preset
    response = client.post(
        "/conversations/parameter-presets",
        json={
            "name": "Get By ID Test",
            "description": "This is a test preset",
            "parameters": {
                "temperature": 0.9,
                "top_p": 0.85
            }
        }
    )
    preset_id = response.json()["id"]
    
    # Retrieve the preset by ID
    response = client.get(f"/conversations/parameter-presets/{preset_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Get By ID Test"
    assert data["description"] == "This is a test preset"
    assert data["parameters"]["temperature"] == 0.9
    assert data["parameters"]["top_p"] == 0.85

def test_get_nonexistent_preset(client):
    """Test that retrieving a non-existent preset returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/conversations/parameter-presets/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_parameter_preset(client):
    """Test updating a parameter preset."""
    # Create a test preset
    response = client.post(
        "/conversations/parameter-presets",
        json={
            "name": "Update Test",
            "parameters": {
                "temperature": 0.7,
                "max_tokens": 1000
            }
        }
    )
    preset_id = response.json()["id"]
    
    # Update the preset
    update_data = {
        "name": "Updated Name",
        "description": "Added description",
        "parameters": {
            "temperature": 0.4,
            "max_tokens": 2000,
            "presence_penalty": 0.1
        }
    }
    response = client.put(f"/conversations/parameter-presets/{preset_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "Added description"
    assert data["parameters"]["temperature"] == 0.4
    assert data["parameters"]["max_tokens"] == 2000
    assert data["parameters"]["presence_penalty"] == 0.1

def test_update_preset_partial(client):
    """Test partially updating a parameter preset."""
    # Create a test preset
    response = client.post(
        "/conversations/parameter-presets",
        json={
            "name": "Partial Update Test",
            "description": "Original description",
            "parameters": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 1000
            }
        }
    )
    preset_id = response.json()["id"]
    
    # Partially update the preset
    update_data = {
        "name": "New Name Only"
    }
    response = client.put(f"/conversations/parameter-presets/{preset_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Name Only"
    assert data["description"] == "Original description"  # Should remain unchanged
    assert data["parameters"]["temperature"] == 0.7  # Should remain unchanged
    
    # Partially update just the parameters
    update_data = {
        "parameters": {
            "temperature": 0.5,
            "new_param": "test"
        }
    }
    response = client.put(f"/conversations/parameter-presets/{preset_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Name Only"  # Should remain unchanged from previous update
    assert data["parameters"]["temperature"] == 0.5  # Should be updated
    assert "top_p" not in data["parameters"]
    assert data["parameters"]["new_param"] == "test"  # Should be added

def test_update_nonexistent_preset(client):
    """Test that updating a non-existent preset returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.put(
        f"/conversations/parameter-presets/{non_existent_id}",
        json={
            "name": "This Should Fail",
            "parameters": {
                "temperature": 0.7
            }
        }
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_parameter_preset(client):
    """Test deleting a parameter preset."""
    # Create a test preset
    response = client.post(
        "/conversations/parameter-presets",
        json={
            "name": "Delete Test",
            "parameters": {
                "temperature": 0.7
            }
        }
    )
    preset_id = response.json()["id"]
    
    # Delete the preset
    response = client.delete(f"/conversations/parameter-presets/{preset_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the preset is gone
    response = client.get(f"/conversations/parameter-presets/{preset_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_nonexistent_preset(client):
    """Test that deleting a non-existent preset returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.delete(f"/conversations/parameter-presets/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND