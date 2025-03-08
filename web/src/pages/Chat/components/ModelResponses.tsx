import React from 'react';
import { Tabs } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import ModelResponseTab from './ModelResponseTab';

interface ModelResponse {
  modelId: string;
  modelName: string;
  content: string;
  tokenCount: number;
  responseTime: number;
  timestamp: string;
}

interface ModelResponsesProps {
  responses: ModelResponse[];
  selectedModelId?: string;
  onDelete?: (modelId: string) => void;
  onCopy?: (modelId: string) => void;
  onSelect?: (modelId: string) => void;
}

const ModelResponses: React.FC<ModelResponsesProps> = ({
  responses,
  selectedModelId,
  onDelete,
  onCopy,
  onSelect,
}) => {
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
              <ModelResponseTab
                modelName={response.modelName}
                content={response.content}
                tokenCount={response.tokenCount}
                responseTime={response.responseTime}
                timestamp={response.timestamp}
                isSelected={selectedModelId === response.modelId}
                onDelete={() => onDelete?.(response.modelId)}
                onCopy={() => onCopy?.(response.modelId)}
                onSelect={() => onSelect?.(response.modelId)}
              />
            </div>
          ),
        }))}
      />
    </div>
  );
};

export default ModelResponses;