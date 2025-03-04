// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/components/ApiKeyList.tsx
import React from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { FrontendApiKey } from '../types';

interface ApiKeyListProps {
  apiKeys: FrontendApiKey[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (key: FrontendApiKey) => void;
  onDelete: (keyId: string) => void;
}

const ApiKeyList: React.FC<ApiKeyListProps> = ({
  apiKeys,
  loading,
  onAdd,
  onEdit,
  onDelete
}) => {
  const columns = [
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
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此密钥?"
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
      <div className="flex justify-between mb-4">
        <h3 className="text-lg m-0">API 密钥列表</h3>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={onAdd}
        >
          添加密钥
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={apiKeys} 
        rowKey="id"
        pagination={false}
        loading={loading}
      />
    </div>
  );
};

export default ApiKeyList;