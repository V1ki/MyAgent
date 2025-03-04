// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/components/ProviderList.tsx
import React from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import { FrontendModelProvider } from '../types';

interface ProviderListProps {
  providers: FrontendModelProvider[];
  loading: boolean;
  onEdit: (provider: FrontendModelProvider) => void;
  onDelete: (id: string) => void;
  onManageKeys: (provider: FrontendModelProvider) => void;
}

const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  loading,
  onEdit,
  onDelete,
  onManageKeys
}) => {
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
      render: (_, record: FrontendModelProvider) => record.apiKeysCount || record.apiKeys.length,
    },
    {
      title: '接口地址',
      dataIndex: 'baseUrl',
      key: 'baseUrl',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: FrontendModelProvider) => (
        <Space size="middle">
          <Button 
            icon={<KeyOutlined />} 
            onClick={() => onManageKeys(record)}
          >
            管理密钥
          </Button>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此提供商?"
            description="删除提供商将同时删除所有相关的API密钥"
            onConfirm={() => onDelete(record.id)}
            okText="是"
            cancelText="否"
          >
            <Button danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="bg-white p-4 rounded">
      <Table 
        columns={columns} 
        dataSource={providers} 
        rowKey="id"
        pagination={false}
        loading={loading}
      />
    </div>
  );
};

export default ProviderList;