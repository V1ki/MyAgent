import React from 'react';
import { Table, Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, ApiOutlined } from '@ant-design/icons';
import { Model, FrontendModelImplementation } from '../../../types/api';

interface ModelListProps {
  models: Model[];
  implementations: FrontendModelImplementation[];
  loading: boolean;
  onEdit: (model: Model) => void;
  onDelete: (id: string) => void;
  onManageImplementations: (model: Model) => void;
}

const ModelList: React.FC<ModelListProps> = ({
  models,
  implementations,
  loading,
  onEdit,
  onDelete,
  onManageImplementations
}) => {
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
      dataIndex: 'implementationsCount',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Model) => (
        <Space size="middle">
          <Button
            icon={<ApiOutlined />}
            onClick={() => onManageImplementations(record)}
          >
            管理实现
          </Button>
          <Button
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模型?"
            description="删除模型将同时删除所有相关的模型实现"
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
        dataSource={models}
        rowKey="id"
        pagination={false}
        loading={loading}
      />
    </div>
  );
};

export default ModelList;