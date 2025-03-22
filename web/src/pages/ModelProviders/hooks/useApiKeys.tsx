import { useState, useCallback } from 'react';
import { message } from 'antd';
import { apiKeyService } from '../../../services/api';

interface UseApiKeysReturn {
  loading: boolean;
  createApiKey: (providerId: string, alias: string, key: string) => Promise<boolean>;
  updateApiKey: (providerId: string, keyId: string, alias: string, key?: string) => Promise<boolean>;
  deleteApiKey: (providerId: string, keyId: string) => Promise<boolean>;
}

export const useApiKeys = (): UseApiKeysReturn => {
  const [loading, setLoading] = useState<boolean>(false);

  const createApiKey = useCallback(async (providerId: string, alias: string, key: string) => {
    try {
      setLoading(true);
      await apiKeyService.create({
        alias,
        key
      },providerId);
      
      message.success('密钥添加成功');
      return true;
    } catch (err) {
      console.error('Failed to create API key:', err);
      message.error('添加失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateApiKey = useCallback(async (providerId: string, keyId: string, alias: string, key?: string) => {
    try {
      setLoading(true);
      await apiKeyService.update(keyId, {
        alias,
        key
      }, providerId);
      
      message.success('密钥更新成功');
      return true;
    } catch (err) {
      console.error('Failed to update API key:', err);
      message.error('更新失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteApiKey = useCallback(async (providerId: string, keyId: string) => {
    try {
      setLoading(true);
      await apiKeyService.delete(keyId, providerId);
      
      message.success('密钥删除成功');
      return true;
    } catch (err) {
      console.error('Failed to delete API key:', err);
      message.error('删除失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createApiKey,
    updateApiKey,
    deleteApiKey
  };
};