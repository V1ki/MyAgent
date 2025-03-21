import React from 'react';
import { Table, Button, Space, Popconfirm, Tag, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { FrontendModelImplementation, Model, FrontendModelProvider } from '../../../types/api';

interface ImplementationListProps {
  implementations: FrontendModelImplementation[];
  providers: FrontendModelProvider[];
  model: Model;
  loading: boolean;
  onEdit: (implementation: FrontendModelImplementation) => void;
  onDelete: (id: string) => void;
}

const ImplementationList: React.FC<ImplementationListProps> = ({
  implementations,
  providers,
  model,
  loading,
  onEdit,
  onDelete
}) => {
  // Filter implementations for the current model
  const modelImplementations = implementations.filter(imp => imp.modelId === model.id);

  // Implementation table columns
  const columns = [
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
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此模型实现?"
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

  // Render model details summary
  const renderModelSummary = () => (
    <div className="bg-white p-4 rounded mb-4">
      <p><strong>模型名称:</strong> {model.name}</p>
      <p><strong>描述:</strong> {model.description || '无'}</p>
      <p>
        <strong>能力:</strong>&nbsp;
        {model.capabilities.map(capability => (
          <Tag color="blue" key={capability}>
            {capability}
          </Tag>
        ))}
      </p>
      <p><strong>模型系列:</strong> {model.family}</p>
    </div>
  );

  return (
    <div>
      {renderModelSummary()}
      <div className="bg-white p-4 rounded">
        <Table
          columns={columns}
          dataSource={modelImplementations}
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default ImplementationList;