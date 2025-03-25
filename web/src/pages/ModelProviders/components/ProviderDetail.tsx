// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/components/ProviderDetail.tsx
import React, { useState } from 'react';
import { Button, Tabs, Badge, Tag } from 'antd';
import { FrontendModelProvider, FreeQuotaType } from '../../../types/api';
import FreeQuota from './FreeQuota';
import { useFreeQuotas } from '../hooks/useFreeQuotas';

interface ProviderDetailProps {
  provider: FrontendModelProvider;
  onBack: () => void;
  onProviderChanged: () => void;
}

const ProviderDetail: React.FC<ProviderDetailProps> = ({
  provider,
  onBack,
  onProviderChanged
}) => {
  const { loading: freeQuotaLoading, createFreeQuota, updateFreeQuota, deleteFreeQuota } = useFreeQuotas();
  const [activeTab, setActiveTab] = useState<string>('keys');

  // Helper to get free quota type display text
  const getFreeQuotaTypeDisplay = () => {
    if (!provider.freeQuotaType) return <Tag color="default">无</Tag>;

    switch (provider.freeQuotaType) {
      case FreeQuotaType.CREDIT:
        return <Tag color="green">赠送金额</Tag>;
      case FreeQuotaType.SHARED_TOKENS:
        return <Tag color="blue">共享赠送Token</Tag>;
      case FreeQuotaType.PER_MODEL_TOKENS:
        return <Tag color="purple">每模型赠送Token</Tag>;
      default:
        return <Tag color="default">未知</Tag>;
    }
  };

  // Handle free quota changes
  const handleFreeQuotaAdd = async (quota) => {
    const success = await createFreeQuota(provider.id, quota);
    if (success) {
      onProviderChanged(); // Reload provider data
    }
    return success;
  };

  const handleFreeQuotaEdit = async (id, quota) => {
    const success = await updateFreeQuota(provider.id, id, quota);
    if (success) {
      onProviderChanged(); // Reload provider data
    }
    return success;
  };

  const handleFreeQuotaDelete = async (id) => {
    const success = await deleteFreeQuota(provider.id, id);
    if (success) {
      onProviderChanged(); // Reload provider data
    }
    return success;
  };

  return (
    <div className="bg-white p-4 rounded mb-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Button
            onClick={onBack}
            className="mr-2"
          >
            返回
          </Button>
          <h2 className="text-xl m-0">
            {provider.name} 的管理
          </h2>
        </div>
      </div>

      <div className="mb-4">
        <p><strong>提供商名称:</strong> {provider.name}</p>
        <p><strong>接口地址:</strong> {provider.baseUrl}</p>
        <p><strong>免费额度类型:</strong> {getFreeQuotaTypeDisplay()}</p>
        {provider.description && (
          <p><strong>描述:</strong> {provider.description}</p>
        )}
      </div>
      <FreeQuota
        provider={provider}
        loading={freeQuotaLoading}
        onAdd={handleFreeQuotaAdd}
        onEdit={handleFreeQuotaEdit}
        onDelete={handleFreeQuotaDelete}
      />
    </div>
  );
};

export default ProviderDetail;