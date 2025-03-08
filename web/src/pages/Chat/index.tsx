import React, { useState } from 'react';
import { Button, Input } from 'antd';
import { SendOutlined, SettingOutlined, RobotOutlined, PlusOutlined } from '@ant-design/icons';
import ConversationTurn from './components/ConversationTurn';
import ModelSelector from './components/ModelSelector';
import SettingsPanel from './components/SettingsPanel';
import ConversationList from './components/ConversationList';
import MessageEditor from './components/MessageEditor';
import { mockConversation, mockModels, mockConversations } from './mockData';
import { Conversation, ConversationTurn as ConversationTurnType } from './types';

interface ModelParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

const defaultParameters: ModelParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

const Chat: React.FC = () => {
  // 对话列表状态
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversationId, setActiveConversationId] = useState('1');

  // 当前对话内容状态
  const [conversation, setConversation] = useState<Conversation>(mockConversation);
  
  // 输入框内容
  const [inputValue, setInputValue] = useState('');
  
  // 已选择的模型
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(['gpt-4']);
  
  // UI状态
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false);
  const [settingsPanelVisible, setSettingsPanelVisible] = useState(false);
  const [messageEditorVisible, setMessageEditorVisible] = useState(false);
  const [editingTurnId, setEditingTurnId] = useState<string | null>(null);
  
  // 模型参数
  const [parameters, setParameters] = useState<ModelParameters>(defaultParameters);

  // 处理消息编辑
  const handleEditMessage = (turnId: string) => {
    const turn = conversation.turns.find(t => t.id === turnId);
    if (turn) {
      setEditingTurnId(turnId);
      setMessageEditorVisible(true);
    }
  };

  // 处理保存编辑的消息
  const handleSaveEditedMessage = (message: string) => {
    if (!editingTurnId) return;

    // TODO: 发送编辑后的消息到后端重新生成回答
    console.log('Regenerating responses for edited message:', message);
    
    setConversation(prev => ({
      ...prev,
      turns: prev.turns.map(turn => {
        if (turn.id === editingTurnId) {
          return {
            ...turn,
            userMessage: {
              ...turn.userMessage,
              content: message
            }
          };
        }
        return turn;
      })
    }));

    setMessageEditorVisible(false);
    setEditingTurnId(null);
  };

  // 处理删除模型回答
  const handleDeleteResponse = (turnId: string, modelId: string) => {
    setConversation(prev => ({
      ...prev,
      turns: prev.turns.map(turn => {
        if (turn.id === turnId) {
          const newResponses = turn.modelResponses.filter(response => response.modelId !== modelId);
          // 如果删除的是当前选中的上下文，需要清除选中状态
          const newSelectedModelId = turn.selectedModelId === modelId ? undefined : turn.selectedModelId;
          return {
            ...turn,
            modelResponses: newResponses,
            selectedModelId: newSelectedModelId
          };
        }
        return turn;
      })
    }));
  };

  // 处理复制模型回答
  const handleCopyResponse = (turnId: string, modelId: string) => {
    const response = conversation.turns
      .find(turn => turn.id === turnId)
      ?.modelResponses.find(response => response.modelId === modelId);
    
    if (response) {
      navigator.clipboard.writeText(response.content);
    }
  };

  // 处理选择模型回答作为上下文
  const handleSelectResponse = (turnId: string, modelId: string) => {
    setConversation(prev => ({
      ...prev,
      turns: prev.turns.map(turn => {
        if (turn.id === turnId) {
          return {
            ...turn,
            selectedModelId: modelId
          };
        }
        return turn;
      })
    }));
  };

  // 处理发送消息
  const handleSendMessage = () => {
    if (!inputValue.trim() || selectedModelIds.length === 0) return;

    // 创建新的对话轮次
    const newTurn = {
      id: String(conversation.turns.length + 1),
      userMessage: {
        content: inputValue,
        timestamp: new Date().toLocaleTimeString(),
        tokenCount: 0, // TODO: 实际计算token数量
      },
      modelResponses: [],
      selectedModelId: undefined,
    };

    // 更新对话内容
    setConversation(prev => ({
      ...prev,
      turns: [...prev.turns, newTurn]
    }));

    // TODO: 发送消息到后端
    console.log('Sending message:', inputValue, 'to models:', selectedModelIds);
    console.log('With parameters:', parameters);

    // 清空输入框
    setInputValue('');

    // TODO: 在收到后端响应后，更新modelResponses
  };

  // 处理保存参数
  const handleSaveParameters = (params: ModelParameters) => {
    setParameters(params);
    setSettingsPanelVisible(false);
  };

  // 处理保存参数预设
  const handleSaveParameterPreset = (params: ModelParameters) => {
    // TODO: 实际保存参数预设到后端
    console.log('Saving parameter preset:', params);
  };

  // 处理选择会话
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setConversations(prev => 
      prev.map(conv => ({
        ...conv,
        isActive: conv.id === id
      }))
    );
    // TODO: 加载选中的会话内容
  };

  // 处理删除会话
  const handleDeleteConversation = (id: string) => {
    // 如果删除的是当前会话，切换到其他会话
    if (id === activeConversationId) {
      const remainingConversations = conversations.filter(conv => conv.id !== id);
      if (remainingConversations.length > 0) {
        handleSelectConversation(remainingConversations[0].id);
      }
    }
    setConversations(prev => prev.filter(conv => conv.id !== id));
  };

  // 处理更新会话标题
  const handleUpdateConversationTitle = (id: string, title: string) => {
    setConversations(prev =>
      prev.map(conv => {
        if (conv.id === id) {
          return { ...conv, title };
        }
        return conv;
      })
    );
    // TODO: 保存更新的标题到后端
  };

  // 处理新建会话
  const handleNewConversation = () => {
    const newId = String(conversations.length + 1);
    const newConversation = {
      id: newId,
      title: `新会话 ${newId}`,
      isActive: true
    };

    setConversations(prev => 
      prev.map(conv => ({
        ...conv,
        isActive: false
      })).concat(newConversation)
    );
    setActiveConversationId(newId);

    // 清空当前会话内容，准备新会话
    setConversation({
      id: newId,
      title: `新会话 ${newId}`,
      turns: []
    });
  };

  const getCurrentEditingMessage = () => {
    if (!editingTurnId) return '';
    return conversation.turns.find(turn => turn.id === editingTurnId)?.userMessage.content || '';
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 会话列表侧边栏 */}
      <aside className="w-64 border-r border-gray-200 bg-white p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">会话列表</h2>
          <Button 
            type="primary"
            aria-label="新建会话"
            icon={<PlusOutlined />}
            onClick={handleNewConversation}
          />
        </div>
        <ConversationList
          conversations={conversations}
          onSelect={handleSelectConversation}
          onDelete={handleDeleteConversation}
          onUpdateTitle={handleUpdateConversationTitle}
        />
      </aside>

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col">
        {/* 消息列表区域 */}
        <section className="flex-1 p-4 overflow-y-auto space-y-4">
          {conversation.turns.map((turn: ConversationTurnType) => (
            <ConversationTurn
              key={turn.id}
              userMessage={turn.userMessage}
              modelResponses={turn.modelResponses}
              selectedModelId={turn.selectedModelId}
              onEditUserMessage={() => handleEditMessage(turn.id)}
              onDeleteModelResponse={(modelId) => handleDeleteResponse(turn.id, modelId)}
              onCopyModelResponse={(modelId) => handleCopyResponse(turn.id, modelId)}
              onSelectModelResponse={(modelId) => handleSelectResponse(turn.id, modelId)}
            />
          ))}
        </section>

        {/* 底部输入区域 */}
        <footer className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-4">
            {/* 设置按钮 */}
            <Button 
              icon={<SettingOutlined />} 
              aria-label="设置"
              type="text"
              className="text-blue-600"
              onClick={() => setSettingsPanelVisible(true)}
            />

            {/* 模型选择按钮 */}
            <Button
              icon={<RobotOutlined />}
              type="text"
              className="text-blue-600"
              onClick={() => setModelSelectorVisible(true)}
            >
              {selectedModelIds.length} 个模型
            </Button>

            {/* 输入框 */}
            <Input.TextArea
              placeholder="输入消息..."
              autoSize={{ minRows: 1, maxRows: 6 }}
              className="flex-1"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onPressEnter={e => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />

            {/* 发送按钮 */}
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || selectedModelIds.length === 0}
            >
              发送
            </Button>
          </div>
        </footer>
      </main>

      {/* 模型选择器 */}
      <ModelSelector
        open={modelSelectorVisible}
        models={mockModels}
        selectedModelIds={selectedModelIds}
        onClose={() => setModelSelectorVisible(false)}
        onModelSelect={setSelectedModelIds}
      />

      {/* 参数设置面板 */}
      <SettingsPanel
        open={settingsPanelVisible}
        parameters={parameters}
        onClose={() => setSettingsPanelVisible(false)}
        onSave={handleSaveParameters}
        onSaveAsPreset={handleSaveParameterPreset}
      />

      {/* 消息编辑器 */}
      <MessageEditor
        visible={messageEditorVisible}
        message={getCurrentEditingMessage()}
        onSave={handleSaveEditedMessage}
        onCancel={() => setMessageEditorVisible(false)}
      />
    </div>
  );
};

export default Chat;