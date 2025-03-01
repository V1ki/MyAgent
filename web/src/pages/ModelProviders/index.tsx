import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, List, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, KeyOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ApiKey {
  id: string;
  alias: string;
  key: string;
}

interface ModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKeys: ApiKey[];
}

const ModelProviders: React.FC = () => {
  const [providers, setProviders] = useState<ModelProvider[]>([
    { 
      id: '1', 
      name: 'OpenAI', 
      baseUrl: 'https://api.openai.com',
      apiKeys: [
        { id: '101', alias: '默认', key: 'sk-***********' },
        { id: '102', alias: '高级账户', key: 'sk-***********' }
      ]
    },
    { 
      id: '2', 
      name: 'Anthropic', 
      baseUrl: 'https://api.anthropic.com',
      apiKeys: [
        { id: '201', alias: '默认', key: 'sk-***********' }
      ]
    },
  ]);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isKeyModalVisible, setIsKeyModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [keyForm] = Form.useForm();
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<ModelProvider | null>(null);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);

  // 表格列定义
  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'API密钥数量',
      key: 'apiKeysCount',
      render: (_, record: ModelProvider) => record.apiKeys.length,
    },
    {
      title: '接口地址',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ModelProvider) => (
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
  const handleEdit = (record: ModelProvider) => {
    setEditingProviderId(record.id);
    form.setFieldsValue({
      name: record.name,
      baseUrl: record.baseUrl,
    });
    setIsModalVisible(true);
  };

  // 处理删除提供商
  const handleDelete = (id: string) => {
    setProviders(providers.filter(provider => provider.id !== id));
    message.success('删除成功');
  };

  // 处理添加提供商
  const showAddModal = () => {
    setEditingProviderId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // 处理提供商模态框确认
  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingProviderId) {
        // 更新现有提供商
        const updatedProviders = providers.map(p => 
          p.id === editingProviderId ? { ...p, name: values.name, baseUrl: values.baseUrl } : p
        );
        setProviders(updatedProviders);
        message.success('提供商更新成功');
      } else {
        // 添加新提供商
        const newProvider = {
          id: `provider-${Date.now()}`,
          name: values.name,
          baseUrl: values.baseUrl,
          apiKeys: values.initialKeyAlias && values.initialKey ? [
            {
              id: `key-${Date.now()}`,
              alias: values.initialKeyAlias,
              key: values.initialKey
            }
          ] : []
        };
        setProviders([...providers, newProvider]);
        message.success('添加成功');
      }
      setIsModalVisible(false);
    });
  };

  // 管理密钥
  const handleManageKeys = (provider: ModelProvider) => {
    setCurrentProvider(provider);
  };

  // 添加密钥
  const showAddKeyModal = () => {
    setEditingKeyId(null);
    keyForm.resetFields();
    setIsKeyModalVisible(true);
  };

  // 编辑密钥
  const handleEditKey = (key: ApiKey) => {
    setEditingKeyId(key.id);
    keyForm.setFieldsValue({
      alias: key.alias,
      key: key.key
    });
    setIsKeyModalVisible(true);
  };

  // 删除密钥
  const handleDeleteKey = (keyId: string) => {
    if (!currentProvider) return;
    
    const updatedProvider = {
      ...currentProvider,
      apiKeys: currentProvider.apiKeys.filter(k => k.id !== keyId)
    };

    setProviders(
      providers.map(p => p.id === updatedProvider.id ? updatedProvider : p)
    );
    
    setCurrentProvider(updatedProvider);
    message.success('密钥删除成功');
  };

  // 处理密钥模态框确认
  const handleKeyModalOk = () => {
    if (!currentProvider) return;

    keyForm.validateFields().then(values => {
      let updatedKeys;
      if (editingKeyId) {
        // 更新现有密钥
        updatedKeys = currentProvider.apiKeys.map(k => 
          k.id === editingKeyId ? { ...k, alias: values.alias, key: values.key } : k
        );
        message.success('密钥更新成功');
      } else {
        // 添加新密钥
        const newKey = {
          id: `key-${Date.now()}`,
          alias: values.alias,
          key: values.key
        };
        updatedKeys = [...currentProvider.apiKeys, newKey];
        message.success('密钥添加成功');
      }

      const updatedProvider = {
        ...currentProvider,
        apiKeys: updatedKeys
      };

      setProviders(
        providers.map(p => p.id === currentProvider.id ? updatedProvider : p)
      );
      setCurrentProvider(updatedProvider);
      setIsKeyModalVisible(false);
    });
  };

  return (
    <div>
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

      {currentProvider ? (
        <div>
          <div className="flex items-center mb-4">
            <Button 
              onClick={() => setCurrentProvider(null)} 
              className="mr-2"
            >
              返回
            </Button>
            <h2 className="text-xl">
              {currentProvider.name} 的 API 密钥管理
            </h2>
          </div>

          <div className="bg-white p-4 rounded mb-4 flex justify-between items-center">
            <div>
              <p><strong>提供商名称:</strong> {currentProvider.name}</p>
              <p><strong>接口地址:</strong> {currentProvider.baseUrl}</p>
            </div>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddKeyModal}
            >
              添加密钥
            </Button>
          </div>

          <div className="bg-white p-4 rounded">
            <List
              itemLayout="horizontal"
              dataSource={currentProvider.apiKeys}
              renderItem={key => (
                <List.Item
                  actions={[
                    <Button icon={<EditOutlined />} onClick={() => handleEditKey(key)}>编辑</Button>,
                    <Popconfirm
                      title="确定删除此密钥?"
                      onConfirm={() => handleDeleteKey(key.id)}
                      okText="是"
                      cancelText="否"
                    >
                      <Button danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={key.alias}
                    description={`密钥: ${'*'.repeat(8)}`}
                  />
                </List.Item>
              )}
            />
          </div>

          <Modal
            title={editingKeyId ? "编辑密钥" : "添加密钥"}
            open={isKeyModalVisible}
            onOk={handleKeyModalOk}
            onCancel={() => setIsKeyModalVisible(false)}
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
                rules={[{ required: true, message: '请输入API密钥' }]}
              >
                <Input.Password placeholder="例如: sk-..." />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ) : (
        <div className="bg-white p-4 rounded">
          <Table 
            columns={columns} 
            dataSource={providers} 
            rowKey="id"
            pagination={false}
          />
        </div>
      )}

      <Modal
        title={editingProviderId ? '编辑提供商' : '添加提供商'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
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