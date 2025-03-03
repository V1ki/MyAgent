import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Modal, Form, Input, Space, Popconfirm, 
  message, Typography, Spin, Alert
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, PlusOutlined, 
  KeyOutlined, InfoCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import { providerService, apiKeyService, ModelProvider, ApiKey } from '../../services/api';

const { Text } = Typography;

// Interface for our frontend component (maps backend data to frontend format)
interface FrontendApiKey {
  id: string;
  alias: string;
  key: string;
}

interface FrontendModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  apiKeys: FrontendApiKey[];
}

// Helper function to convert backend data to frontend format
const toFrontendProvider = (provider: ModelProvider): FrontendModelProvider => ({
  id: provider.id,
  name: provider.name,
  baseUrl: provider.base_url,
  description: provider.description,
  apiKeys: provider.api_keys?.map(key => ({
    id: key.id,
    alias: key.alias,
    key: key.key_preview || '••••••••••••••••'
  })) || []
});

const ModelProviders: React.FC = () => {
  const [providers, setProviders] = useState<FrontendModelProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isKeyModalVisible, setIsKeyModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [keyForm] = Form.useForm();
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<FrontendModelProvider | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);

  // Fetch providers on component mount
  useEffect(() => {
    fetchProviders();
  }, []);

  // Fetch all providers
  const fetchProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await providerService.getProviders();
      setProviders(data.map(toFrontendProvider));
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError('Failed to load model providers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a specific provider with API keys
  const fetchProvider = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await providerService.getProvider(id);
      const frontendProvider = toFrontendProvider(data);
      
      // Update providers list with the fetched provider
      setProviders(prev => 
        prev.map(p => p.id === frontendProvider.id ? frontendProvider : p)
      );
      
      // If we're viewing this provider's details, update that too
      if (currentProvider && currentProvider.id === id) {
        setCurrentProvider(frontendProvider);
      }
      
      return frontendProvider;
    } catch (err) {
      console.error(`Failed to fetch provider ${id}:`, err);
      setError('Failed to load provider details. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
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
      title: 'API密钥数量',
      key: 'apiKeysCount',
      render: (_, record: FrontendModelProvider) => record.apiKeys.length,
    },
    {
      title: '接口地址',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FrontendModelProvider) => (
        <Space size="middle">
          <Button 
            icon={<KeyOutlined />} 
            onClick={() => handleManageKeys(record)}
          >
            管理密钥
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此提供商?"
            description="删除提供商将同时删除所有相关的API密钥"
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

  // 处理编辑提供商
  const handleEdit = (record: FrontendModelProvider) => {
    setEditingProviderId(record.id);
    form.setFieldsValue({
      name: record.name,
      baseUrl: record.baseUrl,
      description: record.description,
    });
    setIsModalVisible(true);
  };

  // 处理删除提供商
  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await providerService.deleteProvider(id);
      setProviders(providers.filter(provider => provider.id !== id));
      message.success('删除成功');
    } catch (err) {
      console.error('Failed to delete provider:', err);
      message.error('删除失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理添加提供商
  const showAddModal = () => {
    setEditingProviderId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 处理提供商模态框确认
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingProviderId) {
        // 更新现有提供商
        setLoading(true);
        await providerService.updateProvider(editingProviderId, {
          name: values.name,
          base_url: values.baseUrl,
          description: values.description
        });
        
        // Refresh the provider data
        await fetchProvider(editingProviderId);
        
        message.success('提供商更新成功');
      } else {
        // 添加新提供商
        setLoading(true);
        const initialKey = values.initialKeyAlias && values.initialKey
          ? { alias: values.initialKeyAlias, key: values.initialKey }
          : undefined;
        
        await providerService.createProvider({
          name: values.name,
          base_url: values.baseUrl,
          description: values.description
        }, initialKey);
        
        // Refresh providers list
        await fetchProviders();
        
        message.success('添加成功');
      }
      
      setIsModalVisible(false);
    } catch (err) {
      console.error('Failed to save provider:', err);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 管理密钥
  const handleManageKeys = async (provider: FrontendModelProvider) => {
    try {
      // Fetch fresh data for this provider including keys
      setLoading(true);
      const freshProvider = await fetchProvider(provider.id);
      if (freshProvider) {
        setCurrentProvider(freshProvider);
      }
    } catch (err) {
      console.error('Failed to fetch provider details:', err);
      message.error('无法加载提供商详情，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 添加密钥
  const showAddKeyModal = () => {
    setEditingKeyId(null);
    keyForm.resetFields();
    setIsKeyModalVisible(true);
  };

  // 编辑密钥
  const handleEditKey = (key: FrontendApiKey) => {
    setEditingKeyId(key.id);
    keyForm.setFieldsValue({
      alias: key.alias,
      key: '' // Don't pre-fill key for security
    });
    setIsKeyModalVisible(true);
  };

  // 删除密钥
  const handleDeleteKey = async (keyId: string) => {
    if (!currentProvider) return;
    
    try {
      setLoading(true);
      await apiKeyService.deleteApiKey(keyId);
      
      // Refresh provider to get updated keys
      await fetchProvider(currentProvider.id);
      
      message.success('密钥删除成功');
    } catch (err) {
      console.error('Failed to delete API key:', err);
      message.error('删除失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理密钥模态框确认
  const handleKeyModalOk = async () => {
    if (!currentProvider) return;

    try {
      const values = await keyForm.validateFields();
      
      if (editingKeyId) {
        // 更新现有密钥
        setLoading(true);
        await apiKeyService.updateApiKey(editingKeyId, {
          alias: values.alias,
          key: values.key || undefined // Only send key if provided
        });
        
        message.success('密钥更新成功');
      } else {
        // 添加新密钥
        setLoading(true);
        await apiKeyService.createApiKey(currentProvider.id, {
          alias: values.alias,
          key: values.key
        });
        
        message.success('密钥添加成功');
      }
      
      // Refresh provider to get updated keys
      await fetchProvider(currentProvider.id);
      
      setIsKeyModalVisible(false);
    } catch (err) {
      console.error('Failed to save API key:', err);
      message.error('保存失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 返回提供商列表
  const returnToProviderList = () => {
    setCurrentProvider(null);
  };

  // 密钥列表表格列定义
  const keyColumns = [
    {
      title: '别名',
      dataIndex: 'alias',
      key: 'alias',
    },
    {
      title: 'API密钥',
      dataIndex: 'key',
      key: 'key',
      render: () => '••••••••••••••••',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: FrontendApiKey) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEditKey(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此密钥?"
            onConfirm={() => handleDeleteKey(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 渲染密钥管理页面
  const renderKeyManagement = () => {
    if (!currentProvider) return null;

    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Button 
              onClick={returnToProviderList} 
              className="mr-2"
            >
              返回
            </Button>
            <h2 className="text-xl m-0">
              {currentProvider.name} 的 API 密钥管理
            </h2>
          </div>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddKeyModal}
          >
            添加密钥
          </Button>
        </div>

        <div className="bg-white p-4 rounded mb-4">
          <p><strong>提供商名称:</strong> {currentProvider.name}</p>
          <p><strong>接口地址:</strong> {currentProvider.baseUrl}</p>
          {currentProvider.description && (
            <p><strong>描述:</strong> {currentProvider.description}</p>
          )}
        </div>

        <div className="bg-white p-4 rounded">
          <Table 
            columns={keyColumns} 
            dataSource={currentProvider.apiKeys} 
            rowKey="id"
            pagination={false}
            loading={loading}
          />
        </div>

        <Modal
          title={editingKeyId ? "编辑密钥" : "添加密钥"}
          open={isKeyModalVisible}
          onOk={handleKeyModalOk}
          onCancel={() => setIsKeyModalVisible(false)}
          confirmLoading={loading}
        >
          <Form form={keyForm} layout="vertical">
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
                { required: !editingKeyId, message: '请输入API密钥' }
              ]}
              help={editingKeyId ? "留空表示不更改密钥" : undefined}
            >
              <Input.Password placeholder="例如: sk-..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    );
  };

  const renderContent = () => {
    if (error) {
      return (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchProviders}>
              重试
            </Button>
          }
        />
      );
    }

    if (currentProvider) {
      return renderKeyManagement();
    }

    return (
      <>
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold" data-testid="page-title">模型提供商管理</h1>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={showAddModal}
          >
            添加提供商
          </Button>
        </div>

        <div className="bg-white p-4 rounded">
          <Table 
            columns={columns} 
            dataSource={providers} 
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
        title={editingProviderId ? '编辑提供商' : '添加提供商'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
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
          
          {!editingProviderId && (
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
    </div>
  );
};

export default ModelProviders;