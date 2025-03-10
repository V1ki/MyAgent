import React, { useState, useEffect, useRef, useCallback, useMemo, useContext } from 'react';
import { List, Button, Input, Tooltip, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useConversations } from '../hooks/useConversations';


interface ConversationListProps {
}

const ConversationList: React.FC<ConversationListProps> = () => {
  const {
    conversations: localConversations,
    selectConversation,
    createConversation,
    deleteConversation,
    conversationsLoading:loading
  } = useConversations();

  // Memoize the header section
  const headerSection = useMemo(() => (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-lg font-semibold">会话列表</h2>
      <Button
        type="primary"
        aria-label="新建会话"
        icon={<PlusOutlined />}
        onClick={()=>createConversation()}
      />
    </div>
  ), []);


  return (
    <>
      {headerSection}
      <List
        loading={loading}
        dataSource={localConversations}
        renderItem={(conversation: any) => {
          // These handlers are specific to each conversation item, so they need to be created inside renderItem
          const handleItemClick = () => {
            selectConversation(conversation.id);
          };
          
      
          // Memoize actions for each list item
          const actions = [
            <Tooltip title="编辑" key="edit">
              <Button
                icon={<EditOutlined />}
                size="small"
                type="text"
                onClick={(e) => {
                  e.stopPropagation();
                  // Use Model to handle title editing
                }}
              />
            </Tooltip>,
            <Popconfirm
              title="确定删除此会话？"
              description="删除后无法恢复"
              onConfirm={()=> {
                deleteConversation(conversation.id);
              }}
              onCancel={
                ()=>{
      
                }
              }
              okText="是"
              cancelText="否"
              key="delete"
            >
              <Tooltip title="删除会话" key="delete-tooltip">
                <Button
                  aria-label="删除会话"
                  icon={<DeleteOutlined />}
                  size="small"
                  type="text"
                  danger
                />
              </Tooltip>
            </Popconfirm>,
          ];
      
          return (
            <List.Item
              className={`cursor-pointer rounded px-2 ${conversation.isActive ? 'bg-blue-50' : ''}`}
              onClick={handleItemClick}
              key={conversation.id}
              actions={actions}
            >
              <div className="truncate">{conversation.title}</div>
            </List.Item>
          )}}
      />
    </>
  );
};

export default ConversationList;