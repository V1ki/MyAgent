import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface MessageEditorProps {
  visible: boolean;
  message: string;
  onSave: (message: string) => void;
  onCancel: () => void;
}

const MessageEditor: React.FC<MessageEditorProps> = ({
  visible,
  message,
  onSave,
  onCancel,
}) => {
  const [editedMessage, setEditedMessage] = useState(message);

  useEffect(() => {
    if (visible) {
      setEditedMessage(message);
    }
  }, [visible, message]);

  const handleSave = () => {
    if (editedMessage.trim()) {
      onSave(editedMessage);
    }
  };

  return (
    <Modal
      title="编辑消息"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!editedMessage.trim() || editedMessage === message}
        >
          保存并重新生成
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Input.TextArea
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          autoSize={{ minRows: 3, maxRows: 10 }}
          placeholder="编辑您的消息..."
        />
        <div className="text-xs text-gray-500">
          编辑消息后，将使用当前选择的模型和参数重新生成回答
        </div>
      </div>
    </Modal>
  );
};

export default MessageEditor;