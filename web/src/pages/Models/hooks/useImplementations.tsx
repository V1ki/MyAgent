import { useState } from 'react';
import { message } from 'antd';
import { modelService } from '../../../services/api';
import { FrontendModelImplementation } from '../../../types/api';

export const useImplementations = () => {
  const [implementations, setImplementations] = useState<FrontendModelImplementation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch implementations for a specific model
  const fetchModelImplementations = async (modelId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelService.implementations.getAll(modelId);
      setImplementations(data);
      return data;
    } catch (err) {
      console.error(`Failed to fetch implementations for model ${modelId}:`, err);
      setError('Failed to load model implementations. Please try again later.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new model implementation
  const createImplementation = async (modelId: string, values: any) => {
    try {
      setLoading(true);
      await modelService.implementations.create({
        providerId: values.providerId,
        modelId: modelId,
        providerModelId: values.providerModelId,
        version: values.version,
        contextWindow: values.contextWindow,
        pricingInfo: values.pricingInfo,
        isAvailable: values.isAvailable,
        customParameters: values.customParameters,
      }, modelId);
      message.success('Model implementation successfully added');
      await fetchModelImplementations(modelId);
      return true;
    } catch (err) {
      console.error('Failed to create model implementation:', err);
      message.error('保存失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing model implementation
  const updateImplementation = async (implementationId: string, values: any, modelId: string) => {
    try {
      setLoading(true);
      await modelService.implementations.update(implementationId, values, modelId);
      message.success('Model implementation successfully updated');
      await fetchModelImplementations(modelId);
      return true;
    } catch (err) {
      console.error('Failed to update model implementation:', err);
      message.error('保存失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a model implementation
  const deleteImplementation = async (id: string, modelId: string) => {
    try {
      setLoading(true);
      await modelService.implementations.delete(id, modelId);
      message.success('Model implementation successfully deleted');
      await fetchModelImplementations(modelId);
      return true;
    } catch (err) {
      console.error('Failed to delete model implementation:', err);
      message.error('Failed to delete model implementation. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    implementations,
    loading,
    error,
    fetchModelImplementations,
    createImplementation,
    updateImplementation,
    deleteImplementation
  };
};