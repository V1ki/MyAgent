import React, { useCallback, useState } from 'react';
import { Button, Input } from 'antd';
import { SendOutlined, SettingOutlined, RobotOutlined } from '@ant-design/icons';
import Conversation from './components/Conversation';
import ModelSelector from './components/ModelSelector';
import SettingsPanel from './components/SettingsPanel';
import ConversationList from './components/ConversationList';
import { useConversations , useModels, useParameterPresets} from './hooks';


const Chat: React.FC = () => {
  
  const {
      conversation,
  
      sendMessage,
      selectResponse,
      deleteResponse,
    } = useConversations();
    
  
    const {
      selectedModelIds,
      selectModels
    } = useModels();
  
  
    const {
      currentParameters,
      createPreset,
      updateParameters,
    } = useParameterPresets();


  
  const [messageInput, setMessageInput] = useState('');
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false);
  const [parameterSettingsVisible, setParameterSettingsVisible] = useState(false);


  // Handle sending a message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || selectedModelIds.length === 0) {
      return false;
    }
    
    const result = await sendMessage(messageInput, selectedModelIds, currentParameters);
    if (result) {
      setMessageInput('');
    }
    return result;
  }, [messageInput, selectedModelIds, currentParameters]);


  // Handle send message on Enter press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle save parameters
  const handleSaveParameters = (params: any) => {
    updateParameters(params);
    setParameterSettingsVisible(false);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 会话列表侧边栏 */}
      <aside className="w-64 border-r border-gray-200 bg-white p-4">

        <ConversationList />
      </aside>

      {/* 主聊天区域 */}
      <main className="flex-1 flex flex-col">
        {/* 消息列表区域 */}
        <Conversation
          turns={conversation?.turns || []}
          onDeleteResponse={deleteResponse}
          onSelectResponse={selectResponse}
        />

        {/* 底部输入区域 */}
        <footer className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center space-x-4">
            {/* 设置按钮 */}
            <Button
              icon={<SettingOutlined />}
              aria-label="设置"
              type="text"
              className="text-blue-600"
              onClick={() => setParameterSettingsVisible(true)}
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
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />

            {/* 发送按钮 */}
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || selectedModelIds.length === 0 }
            >
              发送
            </Button>
          </div>
        </footer>
      </main>

      {/* 模型选择器 */}
      <ModelSelector
        open={modelSelectorVisible}
        selectedModelIds={selectedModelIds}
        onClose={() => setModelSelectorVisible(false)}
        onModelSelect={selectModels}
      />

      {/* 参数设置面板 */}
      <SettingsPanel
        open={parameterSettingsVisible}
        parameters={currentParameters}
        onClose={() => setParameterSettingsVisible(false)}
        onSave={handleSaveParameters}
        onSaveAsPreset={(params) => createPreset(`预设 ${new Date().toLocaleTimeString()}`)}
      />

    </div>
  );
};

export default Chat;