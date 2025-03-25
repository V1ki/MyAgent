import React, { useState } from 'react';
import { Button, Card, Typography, Tag, Empty, Form, Input, Select } from 'antd';
import { EditOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { FrontendFreeQuota, FrontendModelProvider, FreeQuotaType, ResetPeriod } from '../../../types/api';
import { convertToCamelCase } from '../../../services/utils';

const { Text } = Typography;

interface FreeQuotaProps {
  provider: FrontendModelProvider;
  loading: boolean;
  onAdd: (quota: Omit<FrontendFreeQuota, 'id'>) => Promise<boolean>;
  onEdit: (id: string, quota: Partial<FrontendFreeQuota>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const FreeQuota: React.FC<FreeQuotaProps> = ({
  provider,
  loading,
  onAdd,
  onEdit,
  onDelete
}) => {
  const [form] = Form.useForm();
  const [editingQuota, setEditingQuota] = useState<FrontendFreeQuota | null>(null);

  const handleEdit = () => {
    if (editingQuota) {
      const values = form.getFieldsValue();
      console.log('Form values:', values);
      handleFormSubmit({
        ...editingQuota,
        ...values,
      });
    }
    else {  
      console.log('Editing quota:', convertToCamelCase(provider.freeQuota));
      if (provider.freeQuota) {
        form.setFieldsValue({
          ...provider.freeQuota,
        });
      }
     

      setEditingQuota(provider.freeQuota ?? {
        id: '',
        amount: 0,
        providerId: provider.id,
        resetPeriod: ResetPeriod.NEVER,
        modelImplementationId: undefined,
      });
    }
  };

  const handleFormSubmit = async (values: {
    id: string;
    providerId: string;
    modelImplementationId?: string;
    amount: number;
    resetPeriod: ResetPeriod;
  }) => {
    let success = false;

    if (values.id && values.id !== '') {
      success = await onEdit(values.id, values);
    } else {
      // 排除 id 字段
      const { id, ...rest } = values;
      success = await onAdd(rest);
    }

    if (success) {
      setEditingQuota(null);
      form.resetFields();
    }
  };

  // Get reset period display text
  const getResetPeriodText = (period: ResetPeriod) => {
    switch (period) {
      case ResetPeriod.NEVER:
        return '永不重置';
      case ResetPeriod.DAILY:
        return '每天重置';
      case ResetPeriod.WEEKLY:
        return '每周重置';
      case ResetPeriod.MONTHLY:
        return '每月重置';
      case ResetPeriod.YEARLY:
        return '每年重置';
      default:
        return period;
    }
  };

  // Format amount display
  const formatAmount = (amount: number, type?: FreeQuotaType) => {
    if (type === FreeQuotaType.CREDIT) {
      return `${amount.toFixed(2)} 元`;
    }
    return `${amount.toLocaleString()} Token`;
  };

  // Get title based on free quota type
  const getTitle = () => {
    switch (provider.freeQuotaType) {
      case FreeQuotaType.CREDIT:
        return '赠送金额配置';
      case FreeQuotaType.SHARED_TOKENS:
        return '共享赠送Token配置';
      case FreeQuotaType.PER_MODEL_TOKENS:
        return '按模型赠送Token配置';
      default:
        return '免费额度配置';
    }
  };


  const getAmountLabel = () => {
    switch (provider.freeQuotaType) {
      case FreeQuotaType.CREDIT:
        return '赠送金额';
      case FreeQuotaType.SHARED_TOKENS:
      case FreeQuotaType.PER_MODEL_TOKENS:
        return '赠送Token数';
      default:
        return '数量';
    }
  };

  const getAmountPlaceholder = () => {
    switch (provider.freeQuotaType) {
      case FreeQuotaType.CREDIT:
        return '例如: 10.00';
      case FreeQuotaType.SHARED_TOKENS:
      case FreeQuotaType.PER_MODEL_TOKENS:
        return '例如: 100000';
      default:
        return '请输入数量';
    }
  };

  // If no free quota type is set
  if (!provider.freeQuotaType) {
    return (
      <Card title="免费额度配置" style={{ marginTop: '20px' }}>
        <Empty description="请先在提供商设置中选择免费额度类型" />
      </Card>
    );
  }

  const currentQuota = provider.freeQuota;

  return (
    <div>
      <Card
        title={getTitle()}
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={loading}
            onClick={handleEdit}
          >
            {
              !editingQuota ? '编辑' : '保存'
            }
          </Button>
        }
      >
        {!editingQuota ? (
          <div>
            <div className="mb-4">
              <Text strong>数量：</Text>
              <Text>{formatAmount(currentQuota?.amount ?? 0, provider.freeQuotaType)}</Text>
            </div>
            <div className="mb-4">
              <Text strong>重置周期：</Text>
              <Tag color={currentQuota?.resetPeriod === ResetPeriod.NEVER ? 'default' : 'blue'}>
                {getResetPeriodText(currentQuota?.resetPeriod ?? ResetPeriod.NEVER)}
              </Tag>
            </div>
            {provider.freeQuotaType === FreeQuotaType.PER_MODEL_TOKENS && (
              <div className="mb-4">
                <Text strong>模型：</Text>
                <Text>{currentQuota?.modelImplementationId}</Text>
              </div>
            )}
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="amount"
              label={getAmountLabel()}
              rules={[
                { required: true, message: '请输入数量' },
              ]}
            >
              <Input
                type="number"
                step={provider.freeQuotaType === FreeQuotaType.CREDIT ? '0.01' : '1'}
                placeholder={getAmountPlaceholder()}
              />
            </Form.Item>

            <Form.Item
              name="resetPeriod"
              label="重置周期"
              rules={[{ required: true, message: '请选择重置周期' }]}
              initialValue={currentQuota?.resetPeriod ?? ResetPeriod.NEVER}
            >
              <Select>
                <Select.Option value={ResetPeriod.NEVER}>永不重置</Select.Option>
                <Select.Option value={ResetPeriod.DAILY}>每天重置</Select.Option>
                <Select.Option value={ResetPeriod.WEEKLY}>每周重置</Select.Option>
                <Select.Option value={ResetPeriod.MONTHLY}>每月重置</Select.Option>
                <Select.Option value={ResetPeriod.YEARLY}>每年重置</Select.Option>
              </Select>
            </Form.Item>

            {provider.freeQuotaType === FreeQuotaType.PER_MODEL_TOKENS && (
              <Form.Item
                name="modelImplementationId"
                label="选择模型"
                rules={[{ required: true, message: '请选择模型' }]}
              >
                <Select placeholder="选择模型">
                  {/* TODO: Add model options */}
                </Select>
              </Form.Item>
            )}
          </Form>
        )}
      </Card>

    </div>
  );
};

export default FreeQuota;