import React from 'react';
import UserMessage from './UserMessage';
import ModelResponses from './ModelResponses';

interface ConversationTurnProps {
  userMessage: {
    content: string;
    timestamp: string;
    tokenCount: number;
  };
  modelResponses: Array<{
    modelId: string;
    modelName: string;
    content: string;
    tokenCount: number;
    responseTime: number;
    timestamp: string;
  }>;
  selectedModelId?: string;
  onEditUserMessage?: () => void;
  onDeleteModelResponse?: (modelId: string) => void;
  onCopyModelResponse?: (modelId: string) => void;
  onSelectModelResponse?: (modelId: string) => void;
}

const ConversationTurn: React.FC<ConversationTurnProps> = ({
  userMessage,
  modelResponses,
  selectedModelId,
  onEditUserMessage,
  onDeleteModelResponse,
  onCopyModelResponse,
  onSelectModelResponse,
}) => {
  return (
    <div className="space-y-4">
      {/* User Message */}
      <UserMessage
        content={userMessage.content}
        timestamp={userMessage.timestamp}
        tokenCount={userMessage.tokenCount}
        onEdit={onEditUserMessage}
      />

      {/* Model Responses */}
      {modelResponses.length > 0 && (
        <ModelResponses
          responses={modelResponses}
          selectedModelId={selectedModelId}
          onDelete={onDeleteModelResponse}
          onCopy={onCopyModelResponse}
          onSelect={onSelectModelResponse}
        />
      )}
    </div>
  );
};

export default ConversationTurn;