import React, { useCallback } from 'react';
import { ModelResponse, ConversationTurn as Turn } from '../types';

import UserMessage from './UserMessage';
import { Tabs, Button, Space, message } from 'antd';
import { RobotOutlined, DeleteOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';


interface ConversationProps {
  turns: Turn[];
  onDeleteResponse: (turnId: string, modelId: string) => void;
  onSelectResponse: (turnId: string, modelId: string) => void;
}

interface ModelResponsesProps {
  responses: ModelResponse[];
  selectedResponseId?: string;
  onDelete?: (responseId: string) => void;
  onSelect: (responseId: string) => void;
}

const ModelResponses: React.FC<ModelResponsesProps> = ({
  responses,
  selectedResponseId,
  onDelete,
  onSelect,
}) => {


  const handleCopyResponse = useCallback(async (responseId: string) => {
    const response = responses.find(response => response.id === responseId);

    if (response) {
      try {
        await navigator.clipboard.writeText(response.content);
        message.success('已复制到剪贴板');
      }
      catch (err) {
        console.error('Copy failed:', err);
        message.error('复制失败');
      }
    }
  }, [responses]);


  return (
    <div className="bg-white rounded shadow-sm">
      <Tabs
        items={responses.map(response => ({
          key: response.modelId,
          label: (
            <span>
              <RobotOutlined className="mr-1" />
              {response.modelName}
            </span>
          ),
          children: (
            <div className="p-4">
              <div className="model-content">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{response.modelName}回答</span>
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      <span className="mr-1">📊</span>
                      <span>{response.tokenCount} tokens</span>
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      <span className="mr-1">⏱️</span>
                      <span>{response.responseTime}s</span>
                    </span>
                    <span>{response.timestamp}</span>
                  </div>
                </div>

                <p className="whitespace-pre-wrap">{response.content}</p>

                {/* Action Buttons */}
                <div className="mt-2">
                  <Space>
                    {onDelete && (
                      <Button
                        type="text"
                        className="text-blue-600 flex items-center"
                        onClick={() => onDelete?.(response.id)}
                        icon={<DeleteOutlined />}
                      >
                        删除
                      </Button>
                    )}

                    <Button
                      type="text"
                      className="text-blue-600 flex items-center"
                      onClick={() => handleCopyResponse(response.id)}
                      icon={<CopyOutlined />}
                    >
                      复制
                    </Button>

                    <Button
                      type="text"
                      aria-label="选为上下文"
                      disabled={selectedResponseId === response.id}
                      className={`flex items-center ${selectedResponseId === response.id ? 'text-green-600' : 'text-blue-600'}`}
                      onClick={() => onSelect(response.id)}
                      icon={<CheckOutlined />}
                    >
                      {selectedResponseId === response.id ? '已选为上下文' : '选为上下文'}
                    </Button>
                  </Space>
                </div>
              </div>


            </div>
          ),
        }))}
      />
    </div>
  );
};

const Conversation: React.FC<ConversationProps> = ({
  turns,
  onDeleteResponse,
  onSelectResponse
}) => {

  return (
    <section className="flex-1 p-4 overflow-y-auto space-y-4">
      {turns.map((turn) => (
        <div className="space-y-4" key={turn.id}>
        {/* User Message */}
        <UserMessage
          content={turn.userMessage.content}
          timestamp={turn.userMessage.timestamp}
          tokenCount={turn.userMessage.tokenCount}
        />
  
        {/* Model Responses */}
        {turn.modelResponses.length > 0 && (
          <ModelResponses
            responses={turn.modelResponses}
            selectedResponseId={turn.selectedModelId}
            onDelete={(responseId) => onDeleteResponse(turn.id, responseId)}
            onSelect={(responseId) => onSelectResponse(turn.id, responseId)}
          />
        )}
      </div>
      
      ))}
    </section>
  );
};

export default Conversation;