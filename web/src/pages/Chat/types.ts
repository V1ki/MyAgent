import { ModelResponseRead } from "../../types/api";

export interface UserMessage {
  content: string;
  timestamp: string;
  tokenCount: number;
}

export interface ModelResponse {
  id: string;
  modelId: string;
  modelName: string;
  providerName: string;
  content: string;
  tokenCount: number; // Changed from optional to required
  responseTime: number; // Changed from optional to required
  timestamp: string;
  isSelected: boolean;
  error?: string;
}

export interface ConversationTurn {
  id: string;
  userMessage: UserMessage;
  modelResponses: ModelResponse[];
  selectedModelId?: string;
  parameters?: Record<string, any>;
}

export interface Conversation {
  id: string;
  title: string;
  turns: ConversationTurn[];
}

export interface ConversationListItem {
  id: string;
  title: string;
  isActive?: boolean;
}

export interface ModelParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface ParameterPreset {
  id: string;
  name: string;
  description?: string;
  parameters: ModelParameters;
}

export interface ModelOption {
  id: string;
  name: string;
  providerId?: string;
  providerName?: string;
}

// Helper functions to convert between API and frontend formats
export const apiResponseToModelResponse = (
  apiResponse: ModelResponseRead, 
  timestamp: string
): ModelResponse => {
  return {
    ...apiResponse,
    modelId: apiResponse.model_implementation_id || '',
    modelName: apiResponse.model_implementation?.provider_model_id || 'Unknown Model',
    providerName: apiResponse.model_implementation?.provider_id || 'Unknown Provider',
    timestamp: timestamp,
    // Provide default values for fields that might be undefined
    tokenCount: apiResponse.metadata?.token_count || 0,
    responseTime: apiResponse.metadata?.response_time || 0,
    isSelected: apiResponse.is_selected || false,
  };
};