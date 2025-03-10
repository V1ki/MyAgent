
import { createContext, useContext } from 'react';
import {
  ConversationListItem,
  Conversation,
  ConversationTurn,
} from '../types';




interface ConversationContextProps {
  conversations: ConversationListItem[];
  conversation: Conversation | null;
  activeConversationId: string | null;
  conversationsLoading: boolean;
  conversationLoading: boolean;

  selectConversation: (id: string) => void;
  createConversation: (title?: string) => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;

  updateTitle: (title: string) => void;
  addTurn: (turn: ConversationTurn) => void;
  updateTurn: (turnId: string, updatedTurn: Partial<ConversationTurn>) => void;


  sendMessage: (inputMessage: string, selectedModelIds: string[], parameters?: Record<string, any>) => Promise<boolean>;
  selectResponse: (turnId: string, responseId: string) => Promise<boolean>;
  deleteResponse: (turnId: string, responseId: string) => Promise<boolean>;
}

export const ConversationContext = createContext<ConversationContextProps | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
}
