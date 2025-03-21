import React, { useEffect } from 'react';
import { Form, Input, Modal, Select } from 'antd';
import { Model } from '../../../types/api';

interface ModelFormProps {
  visible: boolean;
  model: Model | null;
  loading: boolean;
  onSubmit: (values: any) => void;
  onCancel: () => void;
}

const ModelForm: React.FC<ModelFormProps> = ({
  visible,
  model,
  loading,
  onSubmit,
  onCancel
}) => {
  const [form] = Form.useForm();
  const isEditing = !!model;

  useEffect(() => {
    if (visible && model) {
      form.setFieldsValue({
        name: model.name,
        description: model.description || '',
        capabilities: model.capabilities,
        family: model.family,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, model, form]);

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
      title={isEditing ? '编辑模型' : '添加模型'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入模型名称' }]}
        >
          <Input placeholder="例如: GPT-4o" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
          rules={[{ max: 200, message: '描述不能超过200个字符' }]}
        >
          <Input.TextArea
            placeholder="添加模型描述"
            autoSize={{ minRows: 2, maxRows: 6 }}
          />
        </Form.Item>

        <Form.Item
          name="capabilities"
          label="能力"
          rules={[{ required: true, message: '请选择模型能力' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择模型能力"
            options={[
              { label: '文本生成', value: 'text-generation' },
              { label: '函数调用', value: 'function-calling' },
              { label: '视觉处理', value: 'vision' },
              { label: '语音处理', value: 'audio' },
              { label: '嵌入生成', value: 'embedding' },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="family"
          label="模型系列"
          rules={[{ required: true, message: '请输入模型系列' }]}
        >
          <Input placeholder="例如: GPT-4, Claude, Gemini" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ModelForm;