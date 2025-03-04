// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/components/ApiKeyForm.tsx
import React, { useEffect } from 'react';
import { Form, Input, Modal } from 'antd';
import { FrontendApiKey } from '../types';

interface ApiKeyFormProps {
  visible: boolean;
  apiKey?: FrontendApiKey | null;
  loading: boolean;
  onSubmit: (values: {
    alias: string;
    key?: string;
  }) => void;
  onCancel: () => void;
}

const ApiKeyForm: React.FC<ApiKeyFormProps> = ({
  visible,
  apiKey,
  loading,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();
  const isEditing = !!apiKey;
  
  useEffect(() => {
    if (visible && apiKey) {
      form.setFieldsValue({
        alias: apiKey.alias,
        // Don't pre-fill key for security
        key: ''
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, apiKey, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={isEditing ? "编辑密钥" : "添加密钥"}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="alias"
          label="别名"
          rules={[{ required: true, message: '请输入密钥别名' }]}
        >
          <Input placeholder="例如: 默认, 测试, 生产环境" />
        </Form.Item>
        <Form.Item
          name="key"
          label="API密钥"
          rules={[
            { required: !isEditing, message: '请输入API密钥' }
          ]}
          help={isEditing ? "留空表示不更改密钥" : undefined}
        >
          <Input.Password placeholder="例如: sk-..." />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ApiKeyForm;