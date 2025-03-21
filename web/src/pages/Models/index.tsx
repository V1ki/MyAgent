import React, { useState, useEffect } from 'react';
import { Button, Alert } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import {providerService} from '../../services/api';
import { Model, FrontendModelImplementation, FrontendModelProvider } from '../../types/api';

// Components
import ModelList from './components/ModelList';
import ModelForm from './components/ModelForm';
import ImplementationList from './components/ImplementationList';
import ImplementationForm from './components/ImplementationForm';

// Hooks
import { useModels } from './hooks/useModels';
import { useImplementations } from './hooks/useImplementations';

const Models: React.FC = () => {
  // Models state management with custom hook
  const {
    models,
    loading: modelLoading,
    error: modelError,
    fetchModels,
    createModel,
    updateModel,
    deleteModel
  } = useModels();

  // Implementations state management with custom hook
  const {
    implementations,
    loading: implLoading,
    error: implError,
    fetchModelImplementations,
    createImplementation,
    updateImplementation,
    deleteImplementation
  } = useImplementations();

  // Providers state
  const [providers, setProviders] = useState<FrontendModelProvider[]>([]);
  const [providerError, setProviderError] = useState<string|null>(null);

  // UI state
  const [currentModel, setCurrentModel] = useState<Model | null>(null);
  const [isModelModalVisible, setIsModelModalVisible] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isImplementationModalVisible, setIsImplementationModalVisible] = useState(false);
  const [editingImplementation, setEditingImplementation] = useState<FrontendModelImplementation | null>(null);

  // Initialize data
  useEffect(() => {
    fetchModels();
    fetchProviders();
  }, []);

  // Fetch providers
  const fetchProviders = async () => {
    try {
      const data = await providerService.getProviders();
      setProviders(data);
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setProviderError('Failed to load providers. Some features may be limited.');
    }
  };

  // Model form handlers
  const handleShowAddModel = () => {
    setEditingModel(null);
    setIsModelModalVisible(true);
  };

  const handleEditModel = (model: FrontendModel) => {
    setEditingModel(model);
    setIsModelModalVisible(true);
  };

  const handleModelFormSubmit = async (values: any) => {
    let success = false;
    
    if (editingModel) {
      success = await updateModel(editingModel.id, values);
    } else {
      success = await createModel(values);
    }
    
    if (success) {
      setIsModelModalVisible(false);
    }
  };

  // Implementation management
  const handleManageImplementations = async (model: FrontendModel) => {
    setCurrentModel(model);
    await fetchModelImplementations(model.id);
  };

  const handleReturnToModelList = () => {
    setCurrentModel(null);
  };

  // Implementation form handlers
  const handleShowAddImplementation = () => {
    setEditingImplementation(null);
    setIsImplementationModalVisible(true);
  };

  const handleEditImplementation = (implementation: FrontendModelImplementation) => {
    setEditingImplementation(implementation);
    setIsImplementationModalVisible(true);
  };

  const handleImplementationFormSubmit = async (values: any) => {
    let success = false;
    
    if (editingImplementation) {
      success = await updateImplementation(editingImplementation.id, values, currentModel.id);
    } else if (currentModel) {
      success = await createImplementation(currentModel.id, values);
    }
    
    if (success) {
      setIsImplementationModalVisible(false);
    }
  };

  // Determine what content to render based on state
  const renderContent = () => {
    const error = modelError || providerError;
    
    if (error && !currentModel) {
      return (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" icon={<ReloadOutlined />} onClick={fetchModels}>
              重试
            </Button>
          }
        />
      );
    }

    if (currentModel) {
      // Model implementations view
      return (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Button
                onClick={handleReturnToModelList}
                className="mr-2"
              >
                返回
              </Button>
              <h2 className="text-xl m-0">
                {currentModel.name} 的实现管理
              </h2>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleShowAddImplementation}
            >
              添加实现
            </Button>
          </div>

          {implError ? (
            <Alert
              message="错误"
              description={implError}
              type="error"
              showIcon
              action={
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => fetchModelImplementations(currentModel.id)}
                >
                  重试
                </Button>
              }
            />
          ) : (
            <ImplementationList
              implementations={implementations}
              providers={providers}
              model={currentModel}
              loading={implLoading}
              onEdit={handleEditImplementation}
              onDelete={(id) => deleteImplementation(id, currentModel.id)}
            />
          )}
        </div>
      );
    }

    // Models list view
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold" data-testid="page-title">模型管理</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleShowAddModel}
          >
            添加模型
          </Button>
        </div>

        <ModelList
          models={models}
          implementations={implementations}
          loading={modelLoading}
          onEdit={handleEditModel}
          onDelete={deleteModel}
          onManageImplementations={handleManageImplementations}
        />
      </>
    );
  };

  return (
    <div>
      {renderContent()}

      {/* Model Form Modal */}
      <ModelForm
        visible={isModelModalVisible}
        model={editingModel}
        loading={modelLoading}
        onSubmit={handleModelFormSubmit}
        onCancel={() => setIsModelModalVisible(false)}
      />

      {/* Implementation Form Modal */}
      {currentModel && (
        <ImplementationForm
          visible={isImplementationModalVisible}
          implementation={editingImplementation}
          providers={providers}
          loading={implLoading}
          onSubmit={handleImplementationFormSubmit}
          onCancel={() => setIsImplementationModalVisible(false)}
        />
      )}
    </div>
  );
};

export default Models;