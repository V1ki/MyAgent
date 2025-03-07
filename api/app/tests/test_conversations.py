import pytest
import uuid
from fastapi import status
from datetime import datetime, timezone

def test_create_conversation(client):
    """Test creating a new conversation."""
    response = client.post(
        "/conversations/",
        json={
            "title": "Test Conversation",
            "system_prompt": "You are a helpful assistant."
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Test Conversation"
    assert data["system_prompt"] == "You are a helpful assistant."
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data

def test_create_conversation_minimal(client):
    """Test creating a conversation with minimal data (only required fields)."""
    response = client.post(
        "/conversations/",
        json={
            "title": "Minimal Conversation"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["title"] == "Minimal Conversation"
    assert data["system_prompt"] is None

def test_get_all_conversations(client):
    """Test retrieving all conversations with pagination."""
    # Create several test conversations
    conversation_titles = ["Conversation 1", "Conversation 2", "Conversation 3"]
    
    for title in conversation_titles:
        client.post(
            "/conversations/",
            json={"title": title}
        )
    
    # Retrieve all conversations
    response = client.get("/conversations/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 3
    
    # Verify that all created conversations are present
    titles = [conv["title"] for conv in data]
    for title in conversation_titles:
        assert title in titles

def test_get_all_conversations_pagination(client):
    """Test pagination when retrieving conversations."""
    # Create 5 test conversations
    for i in range(5):
        client.post(
            "/conversations/",
            json={"title": f"Pagination Test {i}"}
        )
    
    # Test limit parameter
    response = client.get("/conversations/?limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    
    # Test skip parameter
    response = client.get("/conversations/?skip=2&limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] != "Pagination Test 0"  # First conversation should be skipped

def test_get_conversation_by_id(client):
    """Test retrieving a specific conversation by ID."""
    # Create a test conversation
    response = client.post(
        "/conversations/",
        json={
            "title": "Get By ID Test",
            "system_prompt": "This is a test system prompt"
        }
    )
    conversation_id = response.json()["id"]
    
    # Retrieve the conversation by ID
    response = client.get(f"/conversations/{conversation_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Get By ID Test"
    assert data["system_prompt"] == "This is a test system prompt"
    assert "turns" in data  # Should include turns in detailed view

def test_get_nonexistent_conversation(client):
    """Test that retrieving a non-existent conversation returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/conversations/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_conversation(client):
    """Test updating a conversation."""
    # Create a test conversation
    response = client.post(
        "/conversations/",
        json={
            "title": "Update Test",
            "system_prompt": "Original system prompt"
        }
    )
    conversation_id = response.json()["id"]
    
    # Update the conversation
    update_data = {
        "title": "Updated Title",
        "system_prompt": "Updated system prompt"
    }
    response = client.put(f"/conversations/{conversation_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "Updated Title"
    assert data["system_prompt"] == "Updated system prompt"

def test_update_conversation_partial(client):
    """Test partially updating a conversation."""
    # Create a test conversation
    response = client.post(
        "/conversations/",
        json={
            "title": "Partial Update Test",
            "system_prompt": "Original system prompt"
        }
    )
    conversation_id = response.json()["id"]
    
    # Partially update the conversation (only title)
    update_data = {
        "title": "New Title Only"
    }
    response = client.put(f"/conversations/{conversation_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["title"] == "New Title Only"
    assert data["system_prompt"] == "Original system prompt"  # Should remain unchanged

def test_update_nonexistent_conversation(client):
    """Test that updating a non-existent conversation returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.put(
        f"/conversations/{non_existent_id}",
        json={"title": "This Should Fail"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_conversation(client):
    """Test deleting a conversation."""
    # Create a test conversation
    response = client.post(
        "/conversations/",
        json={
            "title": "Delete Test"
        }
    )
    conversation_id = response.json()["id"]
    
    # Delete the conversation
    response = client.delete(f"/conversations/{conversation_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify the conversation is gone
    response = client.get(f"/conversations/{conversation_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_nonexistent_conversation(client):
    """Test that deleting a non-existent conversation returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.delete(f"/conversations/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_parameter_presets(client):
    """Test retrieving parameter presets."""
    # The parameter presets should be initialized by initialize_database()
    response = client.get("/conversations/parameter-presets")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Verify that some presets exist (should have been initialized)
    assert len(data) > 0
    
    # Check that presets have the expected structure
    first_preset = data[0]
    assert "id" in first_preset
    assert "name" in first_preset
    assert "parameters" in first_preset