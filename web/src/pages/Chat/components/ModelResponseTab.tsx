import React from 'react';
import { Button, Space } from 'antd';
import { DeleteOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';

interface ModelResponseTabProps {
  modelName: string;
  content: string;
  tokenCount: number;
  responseTime: number;
  timestamp: string;
  isSelected?: boolean;
  onDelete?: () => void;
  onCopy?: () => void;
  onSelect?: () => void;
}

const ModelResponseTab: React.FC<ModelResponseTabProps> = ({
  modelName,
  content,
  tokenCount,
  responseTime,
  timestamp,
  isSelected,
  onDelete,
  onCopy,
  onSelect,
}) => {
  return (
    <div className="model-content">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold">{modelName}回答</span>
        <div className="flex items-center text-sm text-gray-500 space-x-2">
          <span className="bg-gray-100 px-2 py-1 rounded">
            <span className="mr-1">📊</span>
            <span>{tokenCount} tokens</span>
          </span>
          <span className="bg-gray-100 px-2 py-1 rounded">
            <span className="mr-1">⏱️</span>
            <span>{responseTime}s</span>
          </span>
          <span>{timestamp}</span>
        </div>
      </div>
      
      <p className="whitespace-pre-wrap">{content}</p>

      {/* Action Buttons */}
      <div className="mt-2">
        <Space>
          {onDelete && (
            <Button 
              type="text"
              className="text-blue-600 flex items-center"
              onClick={onDelete}
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          )}
          {onCopy && (
            <Button 
              type="text"
              className="text-blue-600 flex items-center"
              onClick={onCopy}
              icon={<CopyOutlined />}
            >
              复制
            </Button>
          )}
          {onSelect && (
            <Button 
              type="text"
              className={`flex items-center ${isSelected ? 'text-green-600' : 'text-blue-600'}`}
              onClick={onSelect}
              icon={<CheckOutlined />}
            >
              {isSelected ? '已选为上下文' : '选为上下文'}
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
};

export default ModelResponseTab;