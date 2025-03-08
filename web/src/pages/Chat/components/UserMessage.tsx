import React from 'react';
import { EditOutlined } from '@ant-design/icons';
import { Button } from 'antd';

interface UserMessageProps {
  content: string;
  timestamp: string;
  tokenCount: number;
  onEdit?: () => void;
}

const UserMessage: React.FC<UserMessageProps> = ({
  content,
  timestamp,
  tokenCount,
  onEdit
}) => {
  return (
    <div className="flex items-start">
      {/* 头像 */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gray-300" />
      </div>

      {/* 消息内容 */}
      <div className="ml-3 bg-white p-3 rounded shadow-sm w-full">
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold">用户</span>
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <span className="bg-gray-100 px-2 py-1 rounded">
              <span className="mr-1">📊</span>
              <span>{tokenCount} tokens</span>
            </span>
            <span>{timestamp}</span>
          </div>
        </div>
        <p className="whitespace-pre-wrap mb-4">{content}</p>

        {/* 编辑按钮 - 现在位于消息卡片内左下角 */}
        {onEdit && (
          <div className="mt-2">
            <Button 
              type="text"
              className="text-blue-600 flex items-center p-0 hover:bg-transparent"
              onClick={onEdit}
              icon={<EditOutlined />}
            >
              编辑
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserMessage;