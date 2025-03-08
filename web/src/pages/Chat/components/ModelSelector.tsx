import React from 'react';
import { Checkbox, Button, Drawer } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';

interface Model {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  open: boolean;
  models: Model[];
  selectedModelIds: string[];
  onClose: () => void;
  onModelSelect: (modelIds: string[]) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  open,
  models,
  selectedModelIds,
  onClose,
  onModelSelect,
}) => {
  const handleModelToggle = (modelId: string, checked: boolean) => {
    if (checked) {
      onModelSelect([...selectedModelIds, modelId]);
    } else {
      onModelSelect(selectedModelIds.filter(id => id !== modelId));
    }
  };

  return (
    <Drawer
      title="选择模型"
      placement="bottom"
      height={300}
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          onClick={onClose}
          disabled={selectedModelIds.length === 0}
        >
          完成 ({selectedModelIds.length})
        </Button>
      }
    >
      <div className="space-y-4">
        {models.map(model => (
          <div key={model.id} className="flex items-center">
            <Checkbox
              checked={selectedModelIds.includes(model.id)}
              onChange={(e: CheckboxChangeEvent) => 
                handleModelToggle(model.id, e.target.checked)
              }
            >
              {model.name}
            </Checkbox>
          </div>
        ))}
      </div>
    </Drawer>
  );
};

export default ModelSelector;