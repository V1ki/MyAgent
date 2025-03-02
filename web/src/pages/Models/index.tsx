import React, { useState } from 'react';
import { 
  Table, Button, Modal, Form, Input, Space, Popconfirm, 
  message, Select, Tag, Card, Tabs, Tooltip
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  ApiOutlined, LinkOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';

const { TabPane } = Tabs;
const { Option } = Select;

// 数据模型接口定义
interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
}

interface Model {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  family: string;
}

interface ModelImplementation {
  id: string;
  providerId: string;
  modelId: string;
  providerModelId: string;
  version: string;
  contextWindow?: number;
  pricingInfo?: PricingInfo;
  isAvailable: boolean;
  customParameters?: Record<string, any>;
}

interface PricingInfo {
  currency: string;
  billingMode: "token" | "request" | "minute" | "hybrid";
  inputPrice?: number;
  outputPrice?: number;
  requestPrice?: number;
  minutePrice?: number;
  tiers?: PricingTier[];
  specialFeatures?: FeaturePricing[];
  freeAllowance?: Allowance;
  minimumCharge?: number;
  effectiveDate?: string;
  notes?: string;
}

interface PricingTier {
  tierName: string;
  volumeThreshold: number;
  inputPrice?: number;
  outputPrice?: number;
  requestPrice?: number;
}

interface FeaturePricing {
  featureName: string;
  additionalPrice: number;
  priceUnit: string;
}

interface Allowance {
  tokens?: number;
  requests?: number;
  validPeriod?: string;
}

// 示例数据
const initialModels: Model[] = [
  {
    id: '1',
    name: 'GPT-4o',
    description: 'OpenAI\'s most powerful multimodal model',
    capabilities: ['text-generation', 'function-calling', 'vision'],
    family: 'GPT-4'
  },
  {
    id: '2',
    name: 'Claude-3 Opus',
    description: 'Anthropic\'s most powerful model',
    capabilities: ['text-generation', 'function-calling', 'vision'],
    family: 'Claude'
  },
  {
    id: '3',
    name: 'Gemini-1.5-Pro',
    description: 'Google\'s most advanced model',
    capabilities: ['text-generation', 'function-calling'],
    family: 'Gemini'
  }
];

// 示例提供商数据
const initialProviders: ModelProvider[] = [
  { 
    id: '1', 
    name: 'OpenAI', 
    baseUrl: 'https://api.openai.com',
    description: 'OpenAI GPT-series models API provider',
  },
  { 
    id: '2', 
    name: 'Anthropic', 
    baseUrl: 'https://api.anthropic.com',
    description: 'Claude model series API provider',
  },
  {
    id: '3',
    name: 'Google AI Studio',
    baseUrl: 'https://ai.google.dev/',
    description: 'Google AI models API provider',
  }
];

// 示例模型实现数据
const initialModelImplementations: ModelImplementation[] = [
  {
    id: '101',
    providerId: '1', // OpenAI
    modelId: '1', // GPT-4o
    providerModelId: 'gpt-4o',
    version: '2023-05',
    contextWindow: 128000,
    isAvailable: true,
    pricingInfo: {
      currency: 'USD',
      billingMode: 'token',
      inputPrice: 5,
      outputPrice: 15,
    }
  },
  {
    id: '102',
    providerId: '1', // OpenAI
    modelId: '1', // GPT-4o
    providerModelId: 'gpt-4o-mini',
    version: '2023-05',
    contextWindow: 128000,
    isAvailable: true,
    pricingInfo: {
      currency: 'USD',
      billingMode: 'token',
      inputPrice: 3,
      outputPrice: 6,
    }
  },
  {
    id: '201',
    providerId: '2', // Anthropic
    modelId: '2', // Claude-3 Opus
    providerModelId: 'claude-3-opus-20240229',
    version: '2024-02',
    contextWindow: 200000,
    isAvailable: true,
    pricingInfo: {
      currency: 'USD',
      billingMode: 'token',
      inputPrice: 15,
      outputPrice: 75,
    }
  },
  {
    id: '301',
    providerId: '3', // Google
    modelId: '3', // Gemini-1.5-Pro
    providerModelId: 'gemini-1.5-pro',
    version: '2024-05',
    contextWindow: 1000000,
    isAvailable: true,
    pricingInfo: {
      currency: 'USD',
      billingMode: 'token',
      inputPrice: 3.5,
      outputPrice: 10.5,
    }
  }
];

const Models: React.FC = () => {
  // 状态管理
  const navigate = useNavigate();
  const [models, setModels] = useState<Model[]>(initialModels);
  const [providers, setProviders] = useState<ModelProvider[]>(initialProviders);
  const [implementations, setImplementations] = useState<ModelImplementation[]>(initialModelImplementations);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [form] = Form.useForm();

  // 跳转到模型实现管理页面
  const navigateToModelImplementations = (model: Model) => {
    setCurrentModel(model);
  };

  // 显示添加模型弹窗
  const showAddModal = () => {
    form.resetFields();
    setEditingModelId(null);
    setIsModalVisible(true);
  };

  // 处理编辑模型
  const handleEdit = (record: Model) => {
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      capabilities: record.capabilities,
      family: record.family,
    });
    setEditingModelId(record.id);
    setIsModalVisible(true);
  };

  // 处理删除模型
  const handleDelete = (id: string) => {
    // 检查是否有与此模型关联的实现
    const hasImplementations = implementations.some(imp => imp.modelId === id);
    
    if (hasImplementations) {
      message.error('此模型有相关的实现，请先删除这些实现');
      return;
    }
    
    setModels(models.filter(model => model.id !== id));
    message.success('模型已成功删除');
  };

  // 处理弹窗确认
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingModelId) {
        // 更新现有模型
        setModels(models.map(model => 
          model.id === editingModelId 
            ? { ...model, ...values } 
            : model
        ));
        message.success('模型已成功更新');
      } else {
        // 添加新模型
        const newModel: Model = {
          id: `m-${Date.now()}`, // 生成临时ID
          ...values,
        };
        setModels([...models, newModel]);
        message.success('模型已成功添加');
      }
      
      setIsModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 返回模型列表
  const returnToModelList = () => {
    setCurrentModel(null);
  };

  // 表格列定义
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
      render: (_: any, record: Model) => 
        implementations.filter(imp => imp.modelId === record.id).length,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Model) => (
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

  // 模型实现相关操作
  const [implementationForm] = Form.useForm();
  const [isImplementationModalVisible, setIsImplementationModalVisible] = useState(false);
  const [editingImplementationId, setEditingImplementationId] = useState<string | null>(null);

  // 显示添加模型实现弹窗
  const showAddImplementationModal = () => {
    implementationForm.resetFields();
    setEditingImplementationId(null);
    setIsImplementationModalVisible(true);
  };

  // 处理编辑模型实现
  const handleEditImplementation = (implementation: ModelImplementation) => {
    implementationForm.setFieldsValue({
      providerId: implementation.providerId,
      providerModelId: implementation.providerModelId,
      version: implementation.version,
      contextWindow: implementation.contextWindow,
      isAvailable: implementation.isAvailable,
      // 注意：复杂对象如pricingInfo可能需要特殊处理
    });
    setEditingImplementationId(implementation.id);
    setIsImplementationModalVisible(true);
  };

  // 处理删除模型实现
  const handleDeleteImplementation = (id: string) => {
    setImplementations(implementations.filter(imp => imp.id !== id));
    message.success('模型实现已成功删除');
  };

  // 处理模型实现弹窗确认
  const handleImplementationModalOk = async () => {
    try {
      const values = await implementationForm.validateFields();
      
      if (editingImplementationId) {
        // 更新现有模型实现
        setImplementations(implementations.map(imp => 
          imp.id === editingImplementationId 
            ? { ...imp, ...values } 
            : imp
        ));
        message.success('模型实现已成功更新');
      } else {
        // 添加新模型实现
        const newImplementation: ModelImplementation = {
          id: `imp-${Date.now()}`, // 生成临时ID
          modelId: currentModel!.id,
          ...values,
          isAvailable: true,
        };
        setImplementations([...implementations, newImplementation]);
        message.success('模型实现已成功添加');
      }
      
      setIsImplementationModalVisible(false);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 模型实现表格列定义
  const implementationColumns = [
    {
      title: '提供商',
      key: 'provider',
      render: (_: any, record: ModelImplementation) => {
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
      render: (_: any, record: ModelImplementation) => {
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
      render: (_: any, record: ModelImplementation) => (
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

  // 渲染模型实现列表
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

        <div className="bg-white p-4 rounded">
          <Table 
            columns={implementationColumns} 
            dataSource={modelImplementations} 
            rowKey="id"
            pagination={false}
          />
        </div>

        <Modal
          title={editingImplementationId ? '编辑模型实现' : '添加模型实现'}
          open={isImplementationModalVisible}
          onOk={handleImplementationModalOk}
          onCancel={() => setIsImplementationModalVisible(false)}
          width={700}
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

            <Tabs defaultActiveKey="1">
              <TabPane tab="定价信息" key="1">
                <Form.Item
                  name={['pricingInfo', 'currency']}
                  label="货币"
                >
                  <Select placeholder="选择货币" defaultValue="USD">
                    <Option value="USD">美元 (USD)</Option>
                    <Option value="CNY">人民币 (CNY)</Option>
                    <Option value="EUR">欧元 (EUR)</Option>
                  </Select>
                </Form.Item>
                
                <Form.Item
                  name={['pricingInfo', 'billingMode']}
                  label="计费模式"
                >
                  <Select placeholder="选择计费模式" defaultValue="token">
                    <Option value="token">按Token计费</Option>
                    <Option value="request">按请求计费</Option>
                    <Option value="minute">按时间计费</Option>
                    <Option value="hybrid">混合计费</Option>
                  </Select>
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
              </TabPane>
              
              <TabPane tab="自定义参数" key="2">
                <p className="text-gray-500 mb-4">
                  自定义参数功能将在后续版本中提供
                </p>
              </TabPane>
            </Tabs>
          </Form>
        </Modal>
      </div>
    );
  };

  return (
    <div>
      {currentModel ? (
        // 模型实现管理视图
        renderImplementationsList()
      ) : (
        // 模型列表视图
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
            />
          </div>
        </>
      )}

      <Modal
        title={editingModelId ? '编辑模型' : '添加模型'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
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