import React, { useEffect } from 'react';
import { Form, Modal, Select, Input } from 'antd';
import { FrontendModelImplementation, FrontendModelProvider } from '../../../types/api';

const { Option } = Select;

interface ImplementationFormProps {
  visible: boolean;
  implementation: FrontendModelImplementation | null;
  providers: FrontendModelProvider[];
  loading: boolean;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

const ImplementationForm: React.FC<ImplementationFormProps> = ({
  visible,
  implementation,
  providers,
  loading,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();
  const isEditing = !!implementation;

  useEffect(() => {
    if (visible && implementation) {
      form.setFieldsValue({
        providerId: implementation.providerId,
        providerModelId: implementation.providerModelId,
        version: implementation.version,
        contextWindow: implementation.contextWindow,
        isAvailable: implementation.isAvailable,
        // Note: complex objects like pricingInfo need special handling
        pricingInfo: {
          currency: implementation.pricingInfo?.currency || 'USD',
          billingMode: implementation.pricingInfo?.billingMode || 'token',
          inputPrice: implementation.pricingInfo?.inputPrice,
          outputPrice: implementation.pricingInfo?.outputPrice,
          notes: implementation.pricingInfo?.notes,
        }
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, implementation, form]);

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
      title={isEditing ? '编辑模型实现' : '添加模型实现'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={700}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="providerId"
          label="提供商"
          rules={[{ required: true, message: '请选择提供商' }]}
        >
          <Select placeholder="选择提供商">
            {providers.map(provider => (
              <Option key={provider.id} value={provider.id}>
                {provider.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="providerModelId"
          label="提供商模型ID"
          rules={[{ required: true, message: '请输入提供商模型ID' }]}
          tooltip="该提供商内部使用的模型标识符"
        >
          <Input placeholder="例如: gpt-4o, claude-3-opus-20240229" />
        </Form.Item>

        <Form.Item
          name="version"
          label="版本"
          rules={[{ required: true, message: '请输入版本' }]}
        >
          <Input placeholder="例如: 2023-05" />
        </Form.Item>

        <Form.Item
          name="contextWindow"
          label="上下文窗口大小"
          tooltip="模型可处理的最大token数量"
        >
          <Input type="number" placeholder="例如: 128000" />
        </Form.Item>

        <Form.Item label="定价信息">
          <Form.Item
            name={['pricingInfo', 'currency']}
            initialValue={'USD'}
            noStyle
          >
            <Select placeholder="选择货币" style={{ width: '30%', marginRight: '10px' }}>
              <Option value="USD">美元 (USD)</Option>
              <Option value="CNY">人民币 (CNY)</Option>
              <Option value="EUR">欧元 (EUR)</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name={['pricingInfo', 'billingMode']}
            initialValue={'token'}
            noStyle
          >
            <Select placeholder="选择计费模式" style={{ width: '30%' }}>
              <Option value="token">按Token计费</Option>
              <Option value="request">按请求计费</Option>
              <Option value="minute">按时间计费</Option>
              <Option value="hybrid">混合计费</Option>
            </Select>
          </Form.Item>
        </Form.Item>

        <Form.Item
          name={['pricingInfo', 'inputPrice']}
          label="输入价格"
          tooltip="每1000 tokens的输入价格"
        >
          <Input type="number" step="0.001" placeholder="例如: 0.01" />
        </Form.Item>

        <Form.Item
          name={['pricingInfo', 'outputPrice']}
          label="输出价格"
          tooltip="每1000 tokens的输出价格"
        >
          <Input type="number" step="0.001" placeholder="例如: 0.03" />
        </Form.Item>

        <Form.Item
          name={['pricingInfo', 'notes']}
          label="备注"
        >
          <Input.TextArea placeholder="添加定价相关的备注" />
        </Form.Item>

        <Form.Item
          name="isAvailable"
          initialValue={true}
          label="状态"
        >
          <Select>
            <Option value={true}>可用</Option>
            <Option value={false}>不可用</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ImplementationForm;