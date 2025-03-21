// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/hooks/useApiKeys.tsx
import { useState, useCallback } from 'react';
import { message } from 'antd';
import { apiKeyService } from '../../../services/api';

interface UseApiKeysReturn {
  loading: boolean;
  createApiKey: (providerId: string, alias: string, key: string) => Promise<boolean>;
  updateApiKey: (keyId: string, alias: string, key?: string) => Promise<boolean>;
  deleteApiKey: (keyId: string) => Promise<boolean>;
}

export const useApiKeys = (): UseApiKeysReturn => {
  const [loading, setLoading] = useState<boolean>(false);

  const createApiKey = useCallback(async (providerId: string, alias: string, key: string) => {
    try {
      setLoading(true);
      await apiKeyService.createApiKey(providerId, {
        alias,
        key
      });
      
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

  const updateApiKey = useCallback(async (keyId: string, alias: string, key?: string) => {
    try {
      setLoading(true);
      await apiKeyService.updateApiKey(keyId, {
        alias,
        key
      });
      
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

  const deleteApiKey = useCallback(async (keyId: string) => {
    try {
      setLoading(true);
      await apiKeyService.deleteApiKey(keyId);
      
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