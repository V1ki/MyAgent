import pytest
import uuid
from fastapi import status

@pytest.fixture
def conversation_id(client):
    """Create a test conversation and return its ID."""
    response = client.post(
        "/conversations/",
        json={
            "title": "Test Conversation for Turns",
            "system_prompt": "This is a test conversation for testing turns."
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    return response.json()["id"]

def test_create_conversation_turn(client, conversation_id):
    """Test creating a new turn in a conversation."""
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={
            "user_input": "Hello, how are you?",
            "model_parameters": {
                "temperature": 0.7,
                "top_p": 0.9
            }
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["user_input"] == "Hello, how are you?"
    assert data["model_parameters"]["temperature"] == 0.7
    assert data["model_parameters"]["top_p"] == 0.9
    assert "id" in data
    assert "created_at" in data
    assert "conversation_id" in data
    assert data["conversation_id"] == conversation_id

def test_create_turn_minimal(client, conversation_id):
    """Test creating a turn with minimal data (only required fields)."""
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={
            "user_input": "Just a simple question"
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["user_input"] == "Just a simple question"
    assert "model_parameters" in data
    assert data["model_parameters"] is None

def test_create_turn_nonexistent_conversation(client):
    """Test that creating a turn for a non-existent conversation returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.post(
        f"/conversations/{non_existent_id}/turns",
        json={
            "user_input": "This should fail"
        }
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_conversation_turns(client, conversation_id):
    """Test retrieving all turns for a conversation."""
    # Create several test turns
    turn_inputs = ["First question", "Second question", "Third question"]
    
    for user_input in turn_inputs:
        client.post(
            f"/conversations/{conversation_id}/turns",
            json={"user_input": user_input}
        )
    
    # Retrieve all turns
    response = client.get(f"/conversations/{conversation_id}/turns")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= len(turn_inputs)
    
    # Verify that all created turns are present
    inputs = [turn["user_input"] for turn in data]
    for user_input in turn_inputs:
        assert user_input in inputs

def test_get_conversation_turns_pagination(client, conversation_id):
    """Test pagination when retrieving turns."""
    # Create 5 test turns
    for i in range(5):
        client.post(
            f"/conversations/{conversation_id}/turns",
            json={"user_input": f"Paginated question {i}"}
        )
    
    # Test limit parameter
    response = client.get(f"/conversations/{conversation_id}/turns?limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    
    # Test skip parameter
    response = client.get(f"/conversations/{conversation_id}/turns?skip=2&limit=2")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert data[0]["user_input"] != "Paginated question 0"  # First turn should be skipped

def test_get_turn_by_id(client, conversation_id):
    """Test retrieving a specific turn by ID."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={
            "user_input": "Get by ID test",
            "model_parameters": {
                "temperature": 0.8
            }
        }
    )
    turn_id = response.json()["id"]
    
    # Retrieve the turn by ID
    response = client.get(f"/conversations/{conversation_id}/turns/{turn_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user_input"] == "Get by ID test"
    assert data["model_parameters"]["temperature"] == 0.8
    assert "responses" in data  # Should include responses in detailed view
    assert "input_versions" in data  # Should include input versions in detailed view

def test_get_nonexistent_turn(client, conversation_id):
    """Test that retrieving a non-existent turn returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.get(f"/conversations/{conversation_id}/turns/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_turn(client, conversation_id):
    """Test updating a turn."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={
            "user_input": "Update test",
            "model_parameters": {
                "temperature": 0.7
            }
        }
    )
    turn_id = response.json()["id"]
    
    # Update the turn
    update_data = {
        "user_input": "Updated input",
        "model_parameters": {
            "temperature": 0.5,
            "top_p": 0.8
        }
    }
    response = client.put(f"/conversations/{conversation_id}/turns/{turn_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user_input"] == "Updated input"
    assert data["model_parameters"]["temperature"] == 0.5
    assert data["model_parameters"]["top_p"] == 0.8

def test_update_turn_partial(client, conversation_id):
    """Test partially updating a turn."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={
            "user_input": "Partial update test",
            "model_parameters": {
                "temperature": 0.7,
                "top_p": 0.9
            }
        }
    )
    turn_id = response.json()["id"]
    
    # Partially update the turn
    update_data = {
        "user_input": "New input only"
    }
    response = client.put(f"/conversations/{conversation_id}/turns/{turn_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["user_input"] == "New input only"
    assert data["model_parameters"]["temperature"] == 0.7  # Should remain unchanged
    assert data["model_parameters"]["top_p"] == 0.9  # Should remain unchanged

def test_update_nonexistent_turn(client, conversation_id):
    """Test that updating a non-existent turn returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.put(
        f"/conversations/{conversation_id}/turns/{non_existent_id}",
        json={"user_input": "This should fail"}
    )
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_turn(client, conversation_id):
    """Test soft deleting a turn."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={"user_input": "Delete test"}
    )
    turn_id = response.json()["id"]
    
    # Delete (soft delete) the turn
    response = client.delete(f"/conversations/{conversation_id}/turns/{turn_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_deleted"] is True  # Should be soft deleted
    
    # The turn should still be retrievable, but marked as deleted
    response = client.get(f"/conversations/{conversation_id}/turns/{turn_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_deleted"] is True

def test_delete_nonexistent_turn(client, conversation_id):
    """Test that deleting a non-existent turn returns a 404."""
    non_existent_id = str(uuid.uuid4())
    response = client.delete(f"/conversations/{conversation_id}/turns/{non_existent_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_create_user_input_version(client, conversation_id):
    """Test creating a new version of a user input."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={"user_input": "Original question"}
    )
    turn_id = response.json()["id"]
    
    # Create a new version
    response = client.post(
        f"/conversations/{conversation_id}/turns/{turn_id}/versions",
        json={
            "content": "Edited question",
            "model_parameters": {
                "temperature": 0.8
            }
        }
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["content"] == "Edited question"
    assert data["model_parameters"]["temperature"] == 0.8
    assert data["is_current"] is True  # Should be set as current version
    assert "id" in data
    assert "turn_id" in data
    assert data["turn_id"] == turn_id

def test_get_input_versions(client, conversation_id):
    """Test retrieving all versions of a user input."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={"user_input": "Initial question"}
    )
    turn_id = response.json()["id"]
    
    # Create multiple versions
    versions = ["First edit", "Second edit", "Third edit"]
    for version in versions:
        client.post(
            f"/conversations/{conversation_id}/turns/{turn_id}/versions",
            json={"content": version}
        )
    
    # Retrieve all versions
    response = client.get(f"/conversations/{conversation_id}/turns/{turn_id}/versions")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    
    # Should have the initial version (from turn creation) plus the added versions
    assert len(data) == len(versions) + 1
    
    # The latest version should be current
    current_versions = [v for v in data if v["is_current"] is True]
    assert len(current_versions) == 1
    assert current_versions[0]["content"] == "Third edit"

def test_set_current_version(client, conversation_id):
    """Test setting a specific version as current."""
    # Create a test turn
    response = client.post(
        f"/conversations/{conversation_id}/turns",
        json={"user_input": "Original question"}
    )
    turn_id = response.json()["id"]
    
    # Create a few versions
    version_ids = []
    for i in range(3):
        response = client.post(
            f"/conversations/{conversation_id}/turns/{turn_id}/versions",
            json={"content": f"Version {i}"}
        )
        version_ids.append(response.json()["id"])
    
    # Set the first version as current (not the latest)
    response = client.put(f"/conversations/{conversation_id}/turns/{turn_id}/versions/{version_ids[0]}/set-current")
    assert response.status_code == status.HTTP_200_OK
    
    # Check that the version is now current
    response = client.get(f"/conversations/{conversation_id}/turns/{turn_id}/versions/{version_ids[0]}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_current"] is True
    
    # Other versions should not be current
    response = client.get(f"/conversations/{conversation_id}/turns/{turn_id}/versions/{version_ids[2]}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["is_current"] is False