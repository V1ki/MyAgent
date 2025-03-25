import { useState, useCallback } from 'react';
import { message } from 'antd';
import { FrontendFreeQuota, ResetPeriod } from '../../../types/api';
import { freeQuotaService } from '../../../services/api';

interface UseFreeQuotasReturn {
  loading: boolean;
  createFreeQuota: (providerId: string, quota: {
    modelImplementationId?: string;
    amount: number;
    resetPeriod: ResetPeriod;
  }) => Promise<boolean>;
  updateFreeQuota: (providerId: string, id: string, quota: Partial<FrontendFreeQuota>) => Promise<boolean>;
  deleteFreeQuota: (providerId: string, id: string) => Promise<boolean>;
}

export const useFreeQuotas = (): UseFreeQuotasReturn => {
  const [loading, setLoading] = useState<boolean>(false);

  const createFreeQuota = useCallback(async (
    providerId: string,
    quota: {
      modelImplementationId?: string;
      amount: number;
      resetPeriod: ResetPeriod;
    }
  ) => {
    try {
      setLoading(true);
      await freeQuotaService.create({
        providerId,
        modelImplementationId: quota.modelImplementationId,
        amount: quota.amount,
        resetPeriod: quota.resetPeriod
      }, providerId);
      
      message.success('免费额度添加成功');
      return true;
    } catch (err) {
      console.error('Failed to create free quota:', err);
      message.error('添加失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFreeQuota = useCallback(async (
    providerId: string,
    id: string,
    quota: Partial<FrontendFreeQuota>
  ) => {
    try {
      setLoading(true);
      await freeQuotaService.update(id, quota, providerId);
      
      message.success('免费额度更新成功');
      return true;
    } catch (err) {
      console.error('Failed to update free quota:', err);
      message.error('更新失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFreeQuota = useCallback(async (
    providerId: string,
    id: string
  ) => {
    try {
      setLoading(true);
      await freeQuotaService.delete(id, providerId);
      
      message.success('免费额度删除成功');
      return true;
    } catch (err) {
      console.error('Failed to delete free quota:', err);
      message.error('删除失败，请稍后重试');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createFreeQuota,
    updateFreeQuota,
    deleteFreeQuota
  };
};