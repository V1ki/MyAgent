import json
import pytest
import uuid
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

from app.models.conversation import Conversation, ConversationTurn, ModelResponse
from app.models.provider import Model, ModelProvider, ModelImplementation, ApiKey
from app.services.orchestrator_service import ModelOrchestrator


@pytest.fixture
def setup_test_data(db):
    """Create test data for multi-chat tests."""
    # Create test provider
    provider = ModelProvider(
        name="Test Provider",
        base_url="https://api.test-provider.com",
        description="Test provider for unit tests"
    )
    db.add(provider)
    db.flush()
    
    # Create API key for the provider
    api_key = ApiKey(
        provider_id=provider.id,
        alias="Test Key",
        key="sk-test-key"
    )
    db.add(api_key)
    db.flush()
    
    # Create test model
    model = Model(
        name="Test Model",
        description="Test model for unit tests",
        capabilities=["text-generation"],
        family="Test"
    )
    db.add(model)
    db.flush()
    
    # Create test model implementations
    implementation1 = ModelImplementation(
        provider_id=provider.id,
        model_id=model.id,
        provider_model_id="test-model-1",
        version="1.0",
        context_window=8192,
        pricing_info={
            "currency": "USD",
            "billingMode": "token",
            "inputPrice": 0.001,
            "outputPrice": 0.002
        },
        is_available=True,
        custom_parameters={"temperature": 0.7}
    )
    db.add(implementation1)
    
    implementation2 = ModelImplementation(
        provider_id=provider.id,
        model_id=model.id,
        provider_model_id="test-model-2",
        version="1.0",
        context_window=16384,
        pricing_info={
            "currency": "USD",
            "billingMode": "token",
            "inputPrice": 0.002,
            "outputPrice": 0.004
        },
        is_available=True,
        custom_parameters={"temperature": 0.9}
    )
    db.add(implementation2)
    db.flush()
    
    # Create test conversation
    conversation = Conversation(
        title="Test Conversation",
        system_prompt="You are a helpful assistant"
    )
    db.add(conversation)
    db.commit()
    
    return {
        "provider": provider,
        "model": model,
        "implementations": [implementation1, implementation2],
        "conversation": conversation
    }


@pytest.mark.asyncio
async def test_chat_with_multiple_models(client, db, setup_test_data):
    """Test POST /chat/multi endpoint."""
    test_data = setup_test_data
    
    # Mock the orchestrator's response
    mock_responses = [
        {
            "implementation_id": str(test_data["implementations"][0].id),
            "model_name": test_data["implementations"][0].provider_model_id,
            "provider_name": test_data["provider"].name,
            "content": "This is a test response from model 1.",
            "metadata": {"model": "test-model-1"},
            "error": None
        },
        {
            "implementation_id": str(test_data["implementations"][1].id),
            "model_name": test_data["implementations"][1].provider_model_id,
            "provider_name": test_data["provider"].name,
            "content": "This is a test response from model 2.",
            "metadata": {"model": "test-model-2"},
            "error": None
        }
    ]
    
    with patch.object(
        ModelOrchestrator, 'orchestrate_model_calls', new_callable=AsyncMock
    ) as mock_orchestrate:
        # Configure the mock
        mock_orchestrate.return_value = mock_responses
        
        # Mock save_model_responses to return model responses
        with patch.object(
            ModelOrchestrator, 'save_model_responses'
        ) as mock_save:
            # Create fake saved responses matching the mock responses
            saved_responses = []
            for idx, resp in enumerate(mock_responses):
                model_response = ModelResponse(
                    id=uuid.uuid4(),
                    turn_id=uuid.uuid4(),
                    model_implementation_id=uuid.UUID(resp["implementation_id"]),
                    content=resp["content"],
                    metadata=resp["metadata"],
                    is_selected=False,
                )
                saved_responses.append(model_response)
            
            mock_save.return_value = saved_responses
            
            # Make the request to test endpoint
            response = client.post(
                "/chat/multi",
                json={
                    "conversation_id": str(test_data["conversation"].id),
                    "model_implementations": [
                        str(test_data["implementations"][0].id),
                        str(test_data["implementations"][1].id)
                    ],
                    "message": "Test message",
                    "parameters": {"temperature": 0.8}
                }
            )
            
    # Assert response status and structure
    assert response.status_code == 200
    assert "turn_id" in response.json()
    assert "responses" in response.json()
    assert len(response.json()["responses"]) == 2
    
    # Check that orchestrator was called with correct parameters
    mock_orchestrate.assert_called_once()
    call_args = mock_orchestrate.call_args[1]
    assert call_args["messages"] == [
        {"role": "user", "content": "Test message"}
    ]
    
    # Verify response content
    responses = response.json()["responses"]
    assert any(r["content"] == "This is a test response from model 1." for r in responses)
    assert any(r["content"] == "This is a test response from model 2." for r in responses)


@pytest.mark.asyncio
async def test_stream_chat_with_multiple_models(client, db, setup_test_data):
    """Test GET /chat/multi/stream endpoint."""
    test_data = setup_test_data
    
    # Mock the orchestrator's response
    mock_responses = [
        {
            "implementation_id": str(test_data["implementations"][0].id),
            "model_name": test_data["implementations"][0].provider_model_id,
            "provider_name": test_data["provider"].name,
            "content": "This is a test response from model 1.",
            "metadata": {"model": "test-model-1"},
            "error": None
        },
        {
            "implementation_id": str(test_data["implementations"][1].id),
            "model_name": test_data["implementations"][1].provider_model_id,
            "provider_name": test_data["provider"].name,
            "content": "This is a test response from model 2.",
            "metadata": {"model": "test-model-2"},
            "error": None
        }
    ]
    
    with patch.object(
        ModelOrchestrator, 'orchestrate_model_calls', new_callable=AsyncMock
    ) as mock_orchestrate:
        # Configure the mock
        mock_orchestrate.return_value = mock_responses
        
        # Make the request to test streaming endpoint
        response = client.get(
            f"/chat/multi/stream",
            params={
                "conversation_id": str(test_data["conversation"].id),
                "models": f"{test_data['implementations'][0].id},{test_data['implementations'][1].id}",
                "message": "Test stream message",
                "parameters": json.dumps({"temperature": 0.8})
            }
        )
    
    # Assert response status and content type
    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]
    
    # Check event stream content
    content = response.content.decode('utf-8')
    assert "event: start" in content
    assert "event: model-response" in content
    assert "event: end" in content
    
    # Ensure we see both model responses in the stream
    for model_idx in range(2):
        model_name = test_data["implementations"][model_idx].provider_model_id
        assert model_name in content


@pytest.mark.asyncio
async def test_select_response_as_context(client, db, setup_test_data):
    """Test PUT /chat/turns/{turn_id}/select-response/{response_id} endpoint."""
    test_data = setup_test_data
    
    # Create a conversation turn
    turn = ConversationTurn(
        conversation_id=test_data["conversation"].id,
        user_input="Test input",
        model_parameters={"temperature": 0.7}
    )
    db.add(turn)
    db.flush()
    
    # Create model responses
    response1 = ModelResponse(
        turn_id=turn.id,
        model_implementation_id=test_data["implementations"][0].id,
        content="Response from model 1",
        metadata={"model": "test-model-1"},
        is_selected=False,
    )
    db.add(response1)
    
    response2 = ModelResponse(
        turn_id=turn.id,
        model_implementation_id=test_data["implementations"][1].id,
        content="Response from model 2",
        metadata={"model": "test-model-2"},
        is_selected=False,
    )
    db.add(response2)
    db.commit()
    
    # Test selecting a response
    select_response = client.put(
        f"/chat/turns/{turn.id}/select-response/{response1.id}"
    )
    
    # Assert response status
    assert select_response.status_code == 200
    assert select_response.json()["status"] == "success"
    assert select_response.json()["selected_response_id"] == str(response1.id)
    
    # Verify database changes
    db.refresh(turn)
    db.refresh(response1)
    db.refresh(response2)
    
    assert turn.active_response_id == response1.id
    assert response1.is_selected == True
    assert response2.is_selected == False


# These tests don't need async because they don't use any async operations
# Remove the warning by not using async for these functions
def test_invalid_conversation_id(client, db):
    """Test error handling when conversation ID is invalid."""
    response = client.post(
        "/chat/multi",
        json={
            "conversation_id": "invalid-uuid",
            "model_implementations": [str(uuid.uuid4())],
            "message": "Test message"
        }
    )
    assert response.status_code == 400
    assert "Invalid UUID format" in response.json()["detail"]
    

def test_missing_required_fields(client, db):
    """Test error handling when required fields are missing."""
    # Test missing conversation_id
    response = client.post(
        "/chat/multi",
        json={
            "model_implementations": [str(uuid.uuid4())],
            "message": "Test message"
        }
    )
    assert response.status_code == 400
    assert "conversation_id is required" in response.json()["detail"]
    
    # Test missing message
    response = client.post(
        "/chat/multi",
        json={
            "conversation_id": str(uuid.uuid4()),
            "model_implementations": [str(uuid.uuid4())]
        }
    )
    assert response.status_code == 400
    assert "message is required" in response.json()["detail"]
    
    # Test missing model_implementations
    response = client.post(
        "/chat/multi",
        json={
            "conversation_id": str(uuid.uuid4()),
            "message": "Test message",
            "model_implementations": []
        }
    )
    assert response.status_code == 400
    assert "At least one model implementation must be specified" in response.json()["detail"]