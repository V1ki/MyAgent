import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Space, Popconfirm,
  message, Select, Tag, Tooltip, Spin, Alert
} from 'antd';
import {
  EditOutlined, DeleteOutlined, PlusOutlined,
  ApiOutlined, InfoCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import { modelService, providerService, FrontendModel, FrontendModelImplementation, ModelProvider } from '../../services/api';

const { Option } = Select;

const Models: React.FC = () => {
  // State management
  const navigate = useNavigate();
  const [models, setModels] = useState<FrontendModel[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [implementations, setImplementations] = useState<FrontendModelImplementation[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<FrontendModel | null>(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, []);

  // Fetch all models
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelService.getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load models. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all providers
  const fetchProviders = async () => {
    try {
      const data = await providerService.getProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      message.error('Failed to load providers. Some features may be limited.');
    }
  };

  // Fetch model implementations for a specific model
  const fetchModelImplementations = async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelService.getModelImplementations(modelId);
      setImplementations(data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch implementations for model ${modelId}:`, err);
      setError('Failed to load model implementations. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Navigate to model implementations management page
  const navigateToModelImplementations = async (model: FrontendModel) => {
    setCurrentModel(model);
    await fetchModelImplementations(model.id);
  };

  // Show add model modal
  const showAddModal = () => {
    form.resetFields();
    setEditingModelId(null);
    setIsModalVisible(true);
  };

  // Handle edit model
  const handleEdit = (record: FrontendModel) => {
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      capabilities: record.capabilities,
      family: record.family,
    });
    setEditingModelId(record.id);
    setIsModalVisible(true);
  };

  // Handle delete model
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await modelService.deleteModel(id);
      message.success('Model successfully deleted');
      // 刷新模型列表
      await fetchModels();
    } catch (err) {
      console.error('Failed to delete model:', err);
      message.error('Failed to delete model. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal confirmation
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingModelId) {
        // Update existing model
        setLoading(true);
        await modelService.updateModel(editingModelId, values);
        message.success('Model successfully updated');
      } else {
        // Add new model
        setLoading(true);
        await modelService.createModel(values);
        message.success('Model successfully added');
      }

      setIsModalVisible(false);
      // 刷新模型列表
      await fetchModels();
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Return to model list
  const returnToModelList = () => {
    setCurrentModel(null);
  };

  // Table columns definition
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '能力',
      dataIndex: 'capabilities',
      key: 'capabilities',
      render: (capabilities: string[]) => (
        <>
          {capabilities.map(capability => {
            let color = 'geekblue';
            if (capability === 'vision') color = 'purple';
            if (capability === 'function-calling') color = 'green';
            
            return (
              <Tag color={color} key={capability}>
                {capability}
              </Tag>
            );
          })}
        </>
      ),
    },
    {
      title: '模型系列',
      dataIndex: 'family',
      key: 'family',
    },
    {
      title: '实现数量',
      key: 'implementationsCount',
      render: (_: any, record: FrontendModel) => {
        const modelImplementations = implementations.filter(imp => imp.modelId === record.id);
        return modelImplementations.length;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FrontendModel) => (
        <Space size="middle">
          <Button
            icon={<ApiOutlined />}
            onClick={() => navigateToModelImplementations(record)}
          >
            管理实现
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模型?"
            description="删除模型将同时删除所有相关的模型实现"
            onConfirm={() => handleDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Model implementation related operations
  const [implementationForm] = Form.useForm();
  const [isImplementationModalVisible, setIsImplementationModalVisible] = useState(false);
  const [editingImplementationId, setEditingImplementationId] = useState<string | null>(null);

  // Show add model implementation modal
  const showAddImplementationModal = () => {
    implementationForm.resetFields();
    setEditingImplementationId(null);
    setIsImplementationModalVisible(true);
  };

  // Handle edit model implementation
  const handleEditImplementation = (implementation: FrontendModelImplementation) => {
    implementationForm.setFieldsValue({
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
    setEditingImplementationId(implementation.id);
    setIsImplementationModalVisible(true);
  };

  // Handle delete model implementation
  const handleDeleteImplementation = async (id: string) => {
    try {
      setLoading(true);
      await modelService.deleteModelImplementation(id);
      message.success('Model implementation successfully deleted');
      // 如果当前有选中的模型，刷新其实现列表
      if (currentModel) {
        await fetchModelImplementations(currentModel.id);
      }
    } catch (err) {
      console.error('Failed to delete model implementation:', err);
      message.error('Failed to delete model implementation. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle model implementation modal confirmation
  const handleImplementationModalOk = async () => {
    try {
      const values = await implementationForm.validateFields();

      if (editingImplementationId) {
        // Update existing model implementation
        setLoading(true);
        await modelService.updateModelImplementation(editingImplementationId, values);
        message.success('Model implementation successfully updated');
      } else if (currentModel) {
        // Add new model implementation for the current model
        setLoading(true);
        await modelService.createModelImplementation(currentModel.id, {
          providerId: values.providerId,
          modelId: currentModel.id, // 显式设置 modelId
          providerModelId: values.providerModelId,
          version: values.version,
          contextWindow: values.contextWindow,
          pricingInfo: values.pricingInfo,
          isAvailable: values.isAvailable,
          customParameters: values.customParameters,
        });
        message.success('Model implementation successfully added');
      }

      setIsImplementationModalVisible(false);
      // 如果当前有选中的模型，刷新其实现列表
      if (currentModel) {
        await fetchModelImplementations(currentModel.id);
      }
    } catch (error) {
      console.error('Form validation failed:', error);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // Model implementation table columns definition
  const implementationColumns = [
    {
      title: '提供商',
      key: 'provider',
      render: (_: any, record: FrontendModelImplementation) => {
        const provider = providers.find(p => p.id === record.providerId);
        return provider ? provider.name : '-';
      },
    },
    {
      title: '提供商模型ID',
      dataIndex: 'providerModelId',
      key: 'providerModelId',
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: '上下文窗口',
      dataIndex: 'contextWindow',
      key: 'contextWindow',
      render: (text: number) => text ? `${text.toLocaleString()} tokens` : '-',
    },
    {
      title: '定价信息',
      key: 'pricing',
      render: (_: any, record: FrontendModelImplementation) => {
        if (!record.pricingInfo) return '-';

        const { currency, inputPrice, outputPrice } = record.pricingInfo;
        return (
          <Tooltip
            title={
              <div>
                <p>输入: {inputPrice} {currency}/1K tokens</p>
                <p>输出: {outputPrice} {currency}/1K tokens</p>
                {record.pricingInfo.notes && <p>备注: {record.pricingInfo.notes}</p>}
              </div>
            }
          >
            <Button type="link" icon={<InfoCircleOutlined />}>
              查看定价
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'isAvailable',
      key: 'isAvailable',
      render: (isAvailable: boolean) => (
        <Tag color={isAvailable ? 'success' : 'error'}>
          {isAvailable ? '可用' : '不可用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FrontendModelImplementation) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEditImplementation(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模型实现?"
            onConfirm={() => handleDeleteImplementation(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Render model implementations list
  const renderImplementationsList = () => {
    if (!currentModel) return null;

    const modelImplementations = implementations.filter(
      imp => imp.modelId === currentModel.id
    );

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button
              onClick={returnToModelList}
              className="mr-2"
            >
              返回
            </Button>
            <h2 className="text-xl m-0">
              {currentModel.name} 的实现管理
            </h2>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddImplementationModal}
          >
            添加实现
          </Button>
        </div>

        <div className="bg-white p-4 rounded mb-4">
          <p><strong>模型名称:</strong> {currentModel.name}</p>
          <p><strong>描述:</strong> {currentModel.description || '无'}</p>
          <p>
            <strong>能力:</strong>&nbsp;
            {currentModel.capabilities.map(capability => (
              <Tag color="blue" key={capability}>
                {capability}
              </Tag>
            ))}
          </p>
          <p><strong>模型系列:</strong> {currentModel.family}</p>
        </div>

        {error ? (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => fetchModelImplementations(currentModel.id)}
              >
                重试
              </Button>
            }
          />
        ) : (
          <div className="bg-white p-4 rounded">
            <Table
              columns={implementationColumns}
              dataSource={modelImplementations}
              rowKey="id"
              pagination={false}
              loading={loading}
            />
          </div>
        )}

        <Modal
          title={editingImplementationId ? '编辑模型实现' : '添加模型实现'}
          open={isImplementationModalVisible}
          onOk={handleImplementationModalOk}
          onCancel={() => setIsImplementationModalVisible(false)}
          width={700}
          confirmLoading={loading}
        >
          <Form form={implementationForm} layout="vertical">
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
              <Space.Compact>
                <Form.Item
                  name={['pricingInfo', 'currency']}
                  initialValue={'USD'}
                  noStyle
                >
                  <Select placeholder="选择货币" style={{ width: '30%' }}>
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
              </Space.Compact>
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
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>可用</Option>
                <Option value={false}>不可用</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  // Render content based on error state
  const renderContent = () => {
    if (error && !currentModel) {
      return (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchModels}>
              重试
            </Button>
          }
        />
      );
    }

    if (currentModel) {
      return renderImplementationsList();
    }

    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" data-testid="page-title">模型管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            添加模型
          </Button>
        </div>

        <div className="bg-white p-4 rounded">
          <Table
            columns={columns}
            dataSource={models}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
        </div>
      </>
    );
  };

  return (
    <div>
      {renderContent()}

      <Modal
        title={editingModelId ? '编辑模型' : '添加模型'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
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
    </div>
  );
};

export default Models;