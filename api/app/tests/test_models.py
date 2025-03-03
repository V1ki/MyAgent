import pytest
import uuid
from fastapi import status

def test_create_model(client):
    """Test creating a new model."""
    response = client.post(
        "/models/",
        json={
            "name": "TestModel",
            "description": "A test model",
            "capabilities": ["text-generation", "function-calling"],
            "family": "TestFamily"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "TestModel"
    assert data["description"] == "A test model"
    assert "text-generation" in data["capabilities"]
    assert "function-calling" in data["capabilities"]
    assert data["family"] == "TestFamily"
    assert "id" in data

def test_create_duplicate_model(client):
    """Test that creating a model with a duplicate name fails."""
    # Create the first model
    response = client.post(
        "/models/",
        json={
            "name": "DuplicateTest",
            "capabilities": ["text-generation"],
            "family": "TestFamily"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    
    # Attempt to create a second model with the same name
    response = client.post(
        "/models/",
        json={
            "name": "DuplicateTest",
            "capabilities": ["text-generation"],
            "family": "AnotherFamily"
        }
    )
    assert response.status_code == status.HTTP_409_CONFLICT

def test_get_all_models(client):
    """Test retrieving all models."""
    # Create some test models
    test_models = [
        {
            "name": f"Model{i}",
            "capabilities": ["text-generation"],
            "family": f"Family{i}"
        }
        for i in range(3)
    ]
    
    for model in test_models:
        response = client.post("/models/", json=model)
        assert response.status_code == status.HTTP_201_CREATED
    
    # Retrieve all models
    response = client.get("/models/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 3
    
    # Verify test models are in the response
    model_names = [model["name"] for model in data]
    assert all(f"Model{i}" in model_names for i in range(3))
    
    # Verify implementation count field exists
    assert all("implementations_count" in model for model in data)

def test_get_model_by_id(client):
    """Test retrieving a model by ID."""
    # Create a test model
    response = client.post(
        "/models/",
        json={
            "name": "GetByIDTest",
            "description": "Test model for get by ID",
            "capabilities": ["text-generation", "vision"],
            "family": "TestFamily"
        }
    )
    model_id = response.json()["id"]
    
    # Retrieve the model by ID
    response = client.get(f"/models/{model_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "GetByIDTest"
    assert data["description"] == "Test model for get by ID"
    assert "text-generation" in data["capabilities"]
    assert "vision" in data["capabilities"]
    assert data["family"] == "TestFamily"
    assert "implementations" in data

def test_get_nonexistent_model(client):
    """Test that retrieving a non-existent model returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/models/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_model(client):
    """Test updating a model."""
    # Create a test model
    response = client.post(
        "/models/",
        json={
            "name": "UpdateTest",
            "capabilities": ["text-generation"],
            "family": "OriginalFamily"
        }
    )
    model_id = response.json()["id"]
    
    # Update the model
    update_data = {
        "name": "UpdatedName",
        "description": "Updated description",
        "capabilities": ["text-generation", "function-calling"],
        "family": "UpdatedFamily"
    }
    response = client.put(f"/models/{model_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "UpdatedName"
    assert data["description"] == "Updated description"
    assert "function-calling" in data["capabilities"]
    assert data["family"] == "UpdatedFamily"

def test_update_model_name_conflict(client):
    """Test that updating a model's name to an existing name fails."""
    # Create two models
    response = client.post(
        "/models/",
        json={
            "name": "ExistingModel",
            "capabilities": ["text-generation"],
            "family": "TestFamily"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    
    response = client.post(
        "/models/",
        json={
            "name": "ModelToUpdate",
            "capabilities": ["text-generation"],
            "family": "TestFamily"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    model_id = response.json()["id"]
    
    # Try to update the second model's name to match the first one
    response = client.put(
        f"/models/{model_id}",
        json={"name": "ExistingModel"}
    )
    assert response.status_code == status.HTTP_409_CONFLICT

def test_delete_model(client):
    """Test deleting a model."""
    # Create a test model
    response = client.post(
        "/models/",
        json={
            "name": "DeleteTest",
            "capabilities": ["text-generation"],
            "family": "TestFamily"
        }
    )
    model_id = response.json()["id"]
    
    # Delete the model
    response = client.delete(f"/models/{model_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the model is gone
    response = client.get(f"/models/{model_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_nonexistent_model(client):
    """Test that deleting a non-existent model returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.delete(f"/models/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND