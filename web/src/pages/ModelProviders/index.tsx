import React, { useState } from 'react';
import { Button, Alert } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

// Components
import ProviderList from './components/ProviderList';
import ProviderForm from './components/ProviderForm';
import ProviderDetail from './components/ProviderDetail';
import ApiKeyList from './components/ApiKeyList';
import ApiKeyForm from './components/ApiKeyForm';

// Hooks
import { useProviders } from './hooks/useProviders';
import { useApiKeys } from './hooks/useApiKeys';

// Types
import { FrontendModelProvider, FrontendApiKey, FreeQuotaType } from '../../types/api';

const ModelProviders: React.FC = () => {
  // Provider state from hook
  const {
    providers,
    loading: providerLoading,
    error,
    fetchProviders,
    fetchProvider,
    createProvider,
    updateProvider,
    deleteProvider
  } = useProviders();

  // API Key state from hook
  const {
    loading: apiKeyLoading,
    createApiKey,
    updateApiKey,
    deleteApiKey
  } = useApiKeys();

  // UI state
  const [isProviderModalVisible, setIsProviderModalVisible] = useState(false);
  const [isKeyModalVisible, setIsKeyModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState<FrontendModelProvider | null>(null);
  const [currentProvider, setCurrentProvider] = useState<FrontendModelProvider | null>(null);
  const [editingKey, setEditingKey] = useState<FrontendApiKey | null>(null);

  // Loading state combined from all hooks
  const loading = providerLoading || apiKeyLoading;

  // Provider actions
  const handleAddProvider = () => {
    setEditingProvider(null);
    setIsProviderModalVisible(true);
  };

  const handleEditProvider = (provider: FrontendModelProvider) => {
    setEditingProvider(provider);
    setIsProviderModalVisible(true);
  };

  const handleProviderFormSubmit = async (values: {
    name: string;
    baseUrl: string;
    description?: string;
    freeQuotaType?: FreeQuotaType;
    initialKeyAlias?: string;
    initialKey?: string;
  }) => {
    if (editingProvider) {
      // Update existing provider
      const success = await updateProvider(
        editingProvider.id,
        values.name,
        values.baseUrl,
        values.description,
        values.freeQuotaType
      );
      
      if (success) {
        setIsProviderModalVisible(false);
        setEditingProvider(null);
      }
    } else {
      // Create new provider
      const initialKey = (values.initialKeyAlias || values.initialKey)
      ? { alias: values.initialKeyAlias ?? "Default" , key: values.initialKey ?? "" }
      : undefined;
      
      const success = await createProvider(
        values.name,
        values.baseUrl,
        values.description,
        values.freeQuotaType,
        initialKey
      );
      
      if (success) {
        setIsProviderModalVisible(false);
      }
    }
  };

  // API Key management actions
  const handleManageKeys = async (provider: FrontendModelProvider) => {
    const freshProvider = await fetchProvider(provider.id);
    if (freshProvider) {
      setCurrentProvider(freshProvider);
    }
  };

  const handleAddKey = () => {
    setEditingKey(null);
    setIsKeyModalVisible(true);
  };

  const handleEditKey = (key: FrontendApiKey) => {
    setEditingKey(key);
    setIsKeyModalVisible(true);
  };

  const handleKeyFormSubmit = async (values: {
    alias: string;
    key?: string;
  }) => {
    if (!currentProvider) return;

    if (editingKey) {
      // Update existing key
      const success = await updateApiKey(
        currentProvider.id,
        editingKey.id,
        values.alias,
        values.key
      );
      
      if (success) {
        setIsKeyModalVisible(false);
        setEditingKey(null);
        // Refresh provider data to get updated keys
        handleRefreshProvider();
      }
    } else {
      // Create new key
      if (!values.key) return;
      
      const success = await createApiKey(
        currentProvider.id,
        values.alias,
        values.key
      );
      
      if (success) {
        setIsKeyModalVisible(false);
        // Refresh provider data to get updated keys
        handleRefreshProvider();
      }
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!currentProvider) return;

    const success = await deleteApiKey(currentProvider.id, keyId);
    if (success) {
      // Refresh provider data to get updated keys list
      handleRefreshProvider();
    }
  };

  // Helper function to refresh current provider data
  const handleRefreshProvider = async () => {
    if (!currentProvider) return;
    
    const freshProvider = await fetchProvider(currentProvider.id);
    if (freshProvider) {
      setCurrentProvider(freshProvider);
    }
  };

  const handleReturnToList = () => {
    setCurrentProvider(null);
  };

  // Render error state
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

  // Render API key management when a provider is selected
  if (currentProvider) {
    return (
      <div>
        <ProviderDetail 
          provider={currentProvider}
          onBack={handleReturnToList}
          onProviderChanged={handleRefreshProvider}
        />
        
        <ApiKeyList
          apiKeys={currentProvider.apiKeys}
          loading={loading}
          onAdd={handleAddKey}
          onEdit={handleEditKey}
          onDelete={handleDeleteKey}
          onOrderChange={handleRefreshProvider}
          providerId={currentProvider.id}
        />
        
        <ApiKeyForm
          visible={isKeyModalVisible}
          apiKey={editingKey}
          loading={loading}
          onSubmit={handleKeyFormSubmit}
          onCancel={() => setIsKeyModalVisible(false)}
        />
      </div>
    );
  }

  // Render main provider list
  return (
    <div>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold" data-testid="page-title">模型提供商管理</h1>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddProvider}
        >
          添加提供商
        </Button>
      </div>

      <ProviderList
        providers={providers}
        loading={loading}
        onEdit={handleEditProvider}
        onDelete={deleteProvider}
        onManageKeys={handleManageKeys}
      />
      
      <ProviderForm
        visible={isProviderModalVisible}
        provider={editingProvider}
        loading={loading}
        onSubmit={handleProviderFormSubmit}
        onCancel={() => setIsProviderModalVisible(false)}
      />
    </div>
  );
};

export default ModelProviders;