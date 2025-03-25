// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/components/ApiKeyList.tsx
import React, { useMemo } from 'react';
import { Table, Button, Space, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EditOutlined, DeleteOutlined, PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { FrontendApiKey } from '../../../types/api';
import { providerService } from '../../../services/api';

interface ApiKeyListProps {
  apiKeys: FrontendApiKey[];
  loading: boolean;
  onAdd: () => void;
  onEdit: (key: FrontendApiKey) => void;
  onDelete: (keyId: string) => void;
  onOrderChange: () => void;
  providerId: string;
}

const ApiKeyList: React.FC<ApiKeyListProps> = ({
  apiKeys,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onOrderChange,
  providerId
}) => {
  // Sort API keys by sort_order
  const sortedApiKeys = useMemo(() => {
    return [...apiKeys].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [apiKeys]);

  const handleMove = async (record: FrontendApiKey, moveUp: boolean) => {
    const currentIndex = sortedApiKeys.findIndex(key => key.id === record.id);
    const newIndex = moveUp ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= sortedApiKeys.length) return;
    
    // Create new orders map
    const newOrders = sortedApiKeys.reduce<Record<string, number>>((acc, key, index) => {
      if (index === currentIndex) {
        acc[key.id] = newIndex;
      } else if (index === newIndex) {
        acc[key.id] = currentIndex;
      } else {
        acc[key.id] = index;
      }
      return acc;
    }, {});

    // Update orders in backend
    const success = await providerService.updateApiKeysOrder(providerId, newOrders);
    if (success) {
      onOrderChange(); // 刷新界面
    }
  };

  const columns: ColumnsType<FrontendApiKey> = [
    {
      title: '排序',
      key: 'sort',
      width: 100,
      render: (_, record) => {
        const index = sortedApiKeys.findIndex(key => key.id === record.id);
        return (
          <Space>
            <Button
              type="text"
              icon={<ArrowUpOutlined />}
              disabled={index === 0}
              onClick={() => handleMove(record, true)}
            />
            <Button
              type="text"
              icon={<ArrowDownOutlined />}
              disabled={index === sortedApiKeys.length - 1}
              onClick={() => handleMove(record, false)}
            />
          </Space>
        );
      },
    },
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
        dataSource={sortedApiKeys} 
        rowKey="id"
        pagination={false}
        loading={loading}
      />
    </div>
  );
};

export default ApiKeyList;