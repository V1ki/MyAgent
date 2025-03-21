// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/components/ProviderDetail.tsx
import React from 'react';
import { Button } from 'antd';
import { FrontendModelProvider } from '../../../types/api';

interface ProviderDetailProps {
  provider: FrontendModelProvider;
  onBack: () => void;
}

const ProviderDetail: React.FC<ProviderDetailProps> = ({
  provider,
  onBack,
}) => {
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
            {provider.name} 的 API 密钥管理
          </h2>
        </div>
      </div>

      <div className="mb-4">
        <p><strong>提供商名称:</strong> {provider.name}</p>
        <p><strong>接口地址:</strong> {provider.baseUrl}</p>
        {provider.description && (
          <p><strong>描述:</strong> {provider.description}</p>
        )}
      </div>
    </div>
  );
};

export default ProviderDetail;