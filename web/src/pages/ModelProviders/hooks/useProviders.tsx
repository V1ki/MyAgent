import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { providerService } from '../../../services/api';
import { FrontendModelProvider } from '../../../types/api';


interface UseProvidersReturn {
  providers: FrontendModelProvider[];
  loading: boolean;
  error: string | null;
  fetchProviders: () => Promise<void>;
  fetchProvider: (id: string) => Promise<FrontendModelProvider | null>;
  createProvider: (
    name: string, 
    baseUrl: string, 
    description?: string, 
    initialKey?: { alias: string, key: string }
  ) => Promise<boolean>;
  updateProvider: (
    id: string, 
    name: string, 
    baseUrl: string, 
    description?: string
  ) => Promise<boolean>;
  deleteProvider: (id: string) => Promise<boolean>;
}

export const useProviders = (): UseProvidersReturn => {
  const [providers, setProviders] = useState<FrontendModelProvider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await providerService.getAll();
      setProviders(data);
      return;
    } catch (err) {
      console.error('Failed to fetch providers:', err);
      setError('Failed to load model providers. Please try again later.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProvider = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const frontendProvider = await providerService.getOne(id);
      
      // Update providers list with the fetched provider
      setProviders(prev => 
        prev.map(p => p.id === frontendProvider.id ? frontendProvider : p)
      );
      
      return frontendProvider;
    } catch (err) {
      console.error(`Failed to fetch provider ${id}:`, err);
      setError('Failed to load provider details. Please try again later.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProvider = useCallback(async (
    name: string, 
    baseUrl: string, 
    description?: string, 
    initialKey?: { alias: string, key: string }
  ) => {
    try {
      setLoading(true);
      await providerService.createProvider({
        name,
        base_url: baseUrl,
        description
      }, initialKey);
      
      await fetchProviders();
      message.success('提供商添加成功');
      return true;
    } catch (err) {
      console.error('Failed to create provider:', err);
      message.error('添加失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProviders]);

  const updateProvider = useCallback(async (
    id: string, 
    name: string, 
    baseUrl: string, 
    description?: string
  ) => {
    try {
      setLoading(true);
      await providerService.update(id, {
        name,
        baseUrl: baseUrl,
        description
      });
      
      await fetchProvider(id);
      message.success('提供商更新成功');
      return true;
    } catch (err) {
      console.error('Failed to update provider:', err);
      message.error('更新失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchProvider]);

  const deleteProvider = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await providerService.delete(id);
      setProviders(providers.filter(provider => provider.id !== id));
      message.success('提供商删除成功');
      return true;
    } catch (err) {
      console.error('Failed to delete provider:', err);
      message.error('删除失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, [providers]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    fetchProviders,
    fetchProvider,
    createProvider,
    updateProvider,
    deleteProvider
  };
};