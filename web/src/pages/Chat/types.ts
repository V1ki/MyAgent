export interface UserMessage {
  content: string;
  timestamp: string;
  tokenCount: number;
}

export interface ModelResponse {
  modelId: string;
  modelName: string;
  content: string;
  tokenCount: number;
  responseTime: number;
  timestamp: string;
}

export interface ConversationTurn {
  id: string;
  userMessage: UserMessage;
  modelResponses: ModelResponse[];
  selectedModelId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  turns: ConversationTurn[];
}