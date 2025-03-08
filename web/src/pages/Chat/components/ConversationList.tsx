import React, { useState } from 'react';
import { Button, Popconfirm, Input } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

interface Conversation {
  id: string;
  title: string;
  isActive?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  onSelect,
  onDelete,
  onUpdateTitle,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // 开始编辑
  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditingTitle(conversation.title);
  };

  // 保存编辑
  const handleSaveEdit = (id: string) => {
    if (editingTitle.trim()) {
      onUpdateTitle(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col">
      <ul className="flex-1 overflow-y-auto">
        {conversations.map(conversation => (
          <li
            key={conversation.id}
            className={`group p-2 bg-white rounded mb-2 shadow-sm hover:bg-gray-100 cursor-pointer flex justify-between items-center transition-all duration-200 ${
              conversation.isActive ? 'border-l-4 border-blue-500 pl-3' : ''
            }`}
            onClick={() => onSelect(conversation.id)}
          >
            {editingId === conversation.id ? (
              <Input
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onPressEnter={() => handleSaveEdit(conversation.id)}
                onBlur={() => handleSaveEdit(conversation.id)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <>
                <span className="truncate flex-1">{conversation.title}</span>
                <div className="flex items-center space-x-1">
                  <Button
                    type="text"
                    className="opacity-0 group-hover:opacity-100"
                    icon={<EditOutlined />}
                    onClick={(e) => handleStartEdit(conversation, e)}
                  />
                  <Popconfirm
                    title="确定删除此会话?"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      onDelete(conversation.id);
                    }}
                    okText="是"
                    cancelText="否"
                    placement="right"
                  >
                    <Button
                      type="text"
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                      icon={<DeleteOutlined />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ConversationList;