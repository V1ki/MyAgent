import { useState, useEffect, createContext, useCallback } from 'react';
import { conversationService ,chatService} from '../../../services/api';
import {
  ConversationListItem,
  Conversation,
  ConversationTurn,
  apiResponseToModelResponse
} from '../types';
import { message } from 'antd';
import {ConversationContext} from './useConversations';


export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const [conversationsLoading, setConversationsLoading] = useState<boolean>(false);
  const [conversationLoading, setConversationLoading] = useState<boolean>(false);

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const loadConversation = useCallback(async () => {
    setConversationLoading(true);
    if (!activeConversationId) {
      setConversationLoading(false);
      return;
    }
    try {
      const apiConversation = await conversationService.getConversation(activeConversationId);

      // Convert to frontend format
      const frontendConversation: Conversation = {
        ...apiConversation,
        turns: []
      };

      // Process turns if available
      if (apiConversation.turns && apiConversation.turns.length > 0) {
        // Create a cache for model implementation details to reduce API calls

        for (const turn of apiConversation.turns) {
          if (!turn.is_deleted) {
            // Get detailed turn data including responses
            
              const turnDetail = await conversationService.getConversationTurn(
                activeConversationId,
                turn.id
              );
              const timestamp = new Date(turnDetail.created_at || turn.created_at).toLocaleTimeString();
              const newTurn: ConversationTurn = {
                id: turn.id,
                userMessage: {
                  content: turn.user_input,
                  timestamp: new Date(turn.created_at).toLocaleTimeString(),
                  tokenCount: 0
                },
                modelResponses: turnDetail.responses.map((response) => apiResponseToModelResponse(response, timestamp)),
                selectedModelId: turn.active_response_id,
                parameters: turn.model_parameters
              };

            frontendConversation.turns.push(newTurn);
          }
        }
      }

      setConversation(frontendConversation);
    } catch (err) {
      console.error('Failed to load conversation:', err);
      message.error('Failed to load conversation');
    } finally {
      setConversationLoading(false);
    }
  }, [activeConversationId]);


  const fetchConversations = async () => {
    setConversationsLoading(true);
    try {
      const apiConversations = await conversationService.getConversations();
      const transformedConversations: ConversationListItem[] = apiConversations.map(conv => ({
        id: conv.id,
        title: conv.title,
        isActive: false
      }));

      if (transformedConversations.length > 0) {
        const firstConversation = transformedConversations[0];
        firstConversation.isActive = true;
        setActiveConversationId(firstConversation.id);
      }

      setConversations(transformedConversations);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      message.error('Failed to load conversations');
    } finally {
      setConversationsLoading(false);
    }
  };

  // Fetch the list of conversations
  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    loadConversation();
  }, [activeConversationId, loadConversation]);


  // Select a conversation
  const selectConversation = useCallback((id: string) => {
    if (id === activeConversationId) return;
    console.log('Selecting conversation:', id);
    setActiveConversationId(id);
    setConversations(prev =>
      prev.map(conv => ({
        ...conv,
        isActive: conv.id === id
      }))
    );
  }, [activeConversationId]);

  // Create a new conversation
  const createConversation = async (title?: string) => {
    setConversationsLoading(true);
    console.log('Creating new conversation with title:', title);

    try {
      const defaultTitle = title || `新会话 ${new Date().toLocaleString()}`;
      const newConversation = await conversationService.createConversation({
        title: defaultTitle
      });

      const newConversationItem: ConversationListItem = {
        id: newConversation.id,
        title: newConversation.title,
        isActive: true
      };

      // Update conversations list
      setConversations(prev => [
        ...prev.map(conv => ({
          ...conv,
          isActive: false
        })), newConversationItem]
      );

      // Set as active conversation
      setActiveConversationId(newConversation.id);

      return newConversation.id;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      message.error('Failed to create new conversation');
      return null;
    } finally {
      setConversationsLoading(false);
    }
  };

  // Update a conversation's title
  const updateConversationTitle = async (id: string, title: string) => {
    try {
      await conversationService.updateConversation(id, { title });

      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === id) {
            return { ...conv, title };
          }
          return conv;
        })
      );

      return true;
    } catch (err) {
      console.error('Failed to update conversation title:', err);
      message.error('Failed to update conversation title');
      return false;
    }
  };

  // Delete a conversation
  const deleteConversation = async (id: string) => {
    try {
      await conversationService.deleteConversation(id);
      await fetchConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      message.error('Failed to delete conversation');
    };
  }

  // Update conversation title
  const updateTitle = (title: string) => {
    if (!conversation) return;

    setConversation({
      ...conversation,
      title
    });
  };

  // Add a new turn to the conversation
  const addTurn = (turn: ConversationTurn) => {
    if (!conversation) return;

    setConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        turns: [...prev.turns, turn]
      };
    });
  };

  // Update a turn in the conversation
  const updateTurn = (turnId: string, updatedTurn: Partial<ConversationTurn>) => {
    if (!conversation) return;

    setConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        turns: prev.turns.map(turn => {
          if (turn.id === turnId) {
            return { ...turn, ...updatedTurn };
          }
          return turn;
        })
      };
    });
  };


  // Send a message to multiple models
  const sendMessage = async (
    inputMessage: string,
    selectedModelIds: string[],
    parameters: Record<string, any> = {}
  ) => {
    if (!activeConversationId || !inputMessage.trim() || selectedModelIds.length === 0) {
      return false;
    }

    setConversationLoading(true);

    try {
      // Create a temporary turn for immediate UI feedback
      const timestamp = new Date().toLocaleTimeString();
      const tempTurnId = `temp-${Date.now()}`;

      const newTurn: ConversationTurn = {
        id: tempTurnId,
        userMessage: {
          content: inputMessage,
          timestamp,
          tokenCount: 0
        },
        modelResponses: [],
        parameters
      };

      // Add the temporary turn
      addTurn(newTurn);

      // Call the API
      const response = await chatService.sendMultiModelMessage({
        conversation_id: activeConversationId,
        model_implementations: selectedModelIds,
        message: inputMessage,
        parameters
      });

      // Convert API responses to the frontend model format
      const modelResponses = response.responses.map(resp =>
        apiResponseToModelResponse(resp, timestamp)
      );

      updateTurn(tempTurnId, {
        id: response.turn_id,
        modelResponses
      });
      
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      message.error('Failed to send message');
      return false;
    } finally {
      setConversationLoading(false);
    }
  };

  // Select a model response as context
  const selectResponse = async (turnId: string, responseId: string) => {
    if (!turnId || !responseId) return false;

    try {
      // Call API to set selected response
      await chatService.selectResponseAsContext(turnId, responseId);

      // Update UI
      updateTurn(turnId, { selectedModelId: responseId });

      return true;
    } catch (err) {
      console.error('Failed to select response:', err);
      message.error('Failed to set response as context');
      return false;
    }
  };

  // Delete a model response
  const deleteResponse = async (turnId: string, responseId: string) => {
    // In a real implementation, this would call the API to delete the response
    // For now, just update the UI by filtering out the deleted response
    try {
      // Update the turn by removing the response
      updateTurn(turnId, {
        modelResponses: []  // This is just a placeholder. You should fetch or filter actual responses
      });
      
      // Note: In a real implementation, you'd call an API endpoint to delete the response
      // await someDeleteResponseApiCall(turnId, responseId);
      
      return true;
    } catch (err) {
      console.error('Failed to delete response:', err);
      message.error('Failed to delete response');
      return false;
    }
  };



  // Memoize the return value to prevent unnecessary re-renders of consumers
  const value = {
    conversations,
    activeConversationId,
    conversationsLoading,
    selectConversation,
    createConversation,
    // updateConversationTitle,
    deleteConversation,
// -----

    conversation,
    conversationLoading,
    updateTitle,
    addTurn,
    updateTurn,
    // ---

    sendMessage,
    selectResponse,
    deleteResponse,
  };
  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  )
};

