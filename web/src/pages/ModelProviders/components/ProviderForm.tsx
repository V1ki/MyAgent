import React, { useEffect } from 'react';
import { Form, Input, Typography, Modal, Select } from 'antd';
import { FrontendModelProvider, FreeQuotaType } from '../../../types/api';

const { Text } = Typography;
const { Option } = Select;

interface ProviderFormProps {
  visible: boolean;
  provider?: FrontendModelProvider | null;
  loading: boolean;
  onSubmit: (values: {
    name: string;
    baseUrl: string;
    description?: string;
    freeQuotaType?: FreeQuotaType;
    initialKeyAlias?: string;
    initialKey?: string;
  }) => void;
  onCancel: () => void;
}

const ProviderForm: React.FC<ProviderFormProps> = ({
  visible,
  provider,
  loading,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();
  const isEditing = !!provider;

  useEffect(() => {
    if (visible && provider) {
      form.setFieldsValue({
        name: provider.name,
        baseUrl: provider.baseUrl,
        description: provider.description,
        freeQuotaType: provider.freeQuotaType,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, provider, form]);

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
      title={isEditing ? '编辑提供商' : '添加提供商'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入提供商名称' }]}
        >
          <Input placeholder="例如: OpenAI" />
        </Form.Item>
        <Form.Item
          name="baseUrl"
          label="接口地址"
          rules={[{ required: true, message: '请输入接口地址' }]}
        >
          <Input placeholder="例如: https://api.openai.com" />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
          rules={[{ max: 200, message: '描述不能超过200个字符' }]}
        >
          <Input.TextArea 
            placeholder="提供商描述信息 (可选, 最多200字符)" 
            showCount 
            maxLength={200} 
            autoSize={{ minRows: 2, maxRows: 4 }} 
          />
        </Form.Item>
        
        <Form.Item
          name="freeQuotaType"
          label="免费额度类型"
          help="设置此提供商使用的免费额度类型"
        >
          <Select placeholder="请选择免费额度类型">
            <Option value={FreeQuotaType.CREDIT}>赠送金额</Option>
            <Option value={FreeQuotaType.SHARED_TOKENS}>共享赠送Token</Option>
            <Option value={FreeQuotaType.PER_MODEL_TOKENS}>每模型赠送Token</Option>
          </Select>
        </Form.Item>
        
        {!isEditing && (
          <>
            <Form.Item
              name="initialKeyAlias"
              label="初始密钥别名"
            >
              <Input placeholder="例如: 默认" />
            </Form.Item>
            <Form.Item
              name="initialKey"
              label="初始API密钥"
            >
              <Input.Password placeholder="例如: sk-..." />
            </Form.Item>
            <Text type="secondary">初始API密钥可以留空，稍后可以添加</Text>
          </>
        )}
      </Form>
    </Modal>
  );
};

export default ProviderForm;