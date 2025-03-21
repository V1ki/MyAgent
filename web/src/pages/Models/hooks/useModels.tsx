import { useState } from 'react';
import { message } from 'antd';
import { modelService } from '../../../services/api';
import { Model } from '../../../types/api';

export const useModels = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all models
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await modelService.getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Failed to load models. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Create a new model
  const createModel = async (values: any) => {
    try {
      setLoading(true);
      await modelService.createModel(values);
      message.success('Model successfully added');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Failed to create model:', err);
      message.error('保存失败，请稍后再试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing model
  const updateModel = async (id: string, values: any) => {
    try {
      setLoading(true);
      await modelService.updateModel(id, values);
      message.success('Model successfully updated');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Failed to update model:', err);
      message.error('保存失败，请稍后再试');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a model
  const deleteModel = async (id: string) => {
    try {
      setLoading(true);
      await modelService.deleteModel(id);
      message.success('Model successfully deleted');
      await fetchModels();
      return true;
    } catch (err) {
      console.error('Failed to delete model:', err);
      message.error('Failed to delete model. Please try again later.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    models,
    loading,
    error,
    fetchModels,
    createModel,
    updateModel,
    deleteModel
  };
};