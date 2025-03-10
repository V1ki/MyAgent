import React, { useState, useEffect, useRef } from 'react';
import { Modal, Checkbox, Button, Empty, Spin, Alert } from 'antd';
import { modelService } from '../../../services/api';
import { ModelOption } from '../types';

interface ModelSelectorProps {
  open: boolean;
  selectedModelIds: string[];
  onClose: () => void;
  onModelSelect: (selectedIds: string[]) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  open,
  selectedModelIds,
  onClose,
  onModelSelect,
}) => {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selected, setSelected] = useState<string[]>(selectedModelIds);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fetchInProgress = useRef(false);

  // 加载模型数据
  useEffect(() => {
    // Only fetch models when the modal is opened and not already loading
    if (!open || fetchInProgress.current) return;

    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      fetchInProgress.current = true;
      try {
        // First fetch all models
        const apiModels = await modelService.getModels();
        
        const modelOptions: ModelOption[] = [];
        
        // For each model, fetch its implementations
        for (const model of apiModels) {
          const implementations = await modelService.getModelImplementations(model.id);
          
          // Map each implementation to a model option
          implementations.forEach(impl => {
            modelOptions.push({
              id: impl.id,
              name: `${model.name} (${impl.version})`,
              providerId: impl.providerId,
              // You would need to fetch provider details to get the name
              // This is a simplification
              providerName: impl.providerId
            });
          });
        }
        
        setModels(modelOptions);
      } catch (error) {
        console.error('Error fetching models:', error);
        setError('加载模型失败，请稍后重试');
      } finally {
        setLoading(false);
        fetchInProgress.current = false;
      }
    };

    if (open) {
      fetchModels();
    }
  }, [open]);

  // 重置选中状态
  useEffect(() => {
    setSelected(selectedModelIds);
  }, [selectedModelIds, open]);

  // 处理模型选中状态变化
  const handleModelChange = (modelId: string) => {
    if (selected.includes(modelId)) {
      setSelected(selected.filter(id => id !== modelId));
    } else {
      setSelected([...selected, modelId]);
    }
  };

  // 全选/全不选
  const handleSelectAll = () => {
    if (selected.length === models.length) {
      setSelected([]);
    } else {
      setSelected(models.map(model => model.id));
    }
  };

  // 确认选择
  const handleConfirm = () => {
    onModelSelect(selected);
    onClose();
  };

  return (
    <Modal
      title="选择模型"
      open={open}
      onCancel={onClose}
      width={500}
      footer={[
        <Button key="select-all" onClick={handleSelectAll}>
          {selected.length === models.length ? '取消全选' : '全选'}
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          disabled={selected.length === 0}
        >
          确认 ({selected.length})
        </Button>,
      ]}
    >
      {loading ? (
        <div className="flex justify-center p-8">
          <Spin >加载模型中...</Spin>
        </div>
      ) : error ? (
        <Alert message={error} type="error" />
      ) : models.length === 0 ? (
        <Empty description="没有可用的模型" />
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {models.map(model => (
            <div
              key={model.id}
              className="p-3 border-b last:border-b-0 hover:bg-gray-50"
            >
              <Checkbox
                checked={selected.includes(model.id)}
                onChange={() => handleModelChange(model.id)}
              >
                <div>
                  <div className="font-medium">{model.name}</div>
                  {model.providerName && (
                    <div className="text-xs text-gray-500">
                      提供商: {model.providerName}
                    </div>
                  )}
                </div>
              </Checkbox>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default ModelSelector;