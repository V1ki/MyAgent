import React, { useState } from 'react';
import { Select, Button, Input, Modal } from 'antd';
import { SaveOutlined } from '@ant-design/icons';

interface ModelParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface ParameterPreset {
  id: string;
  name: string;
  parameters: ModelParameters;
}

interface ParameterPresetSelectorProps {
  presets: ParameterPreset[];
  onSelectPreset: (preset: ParameterPreset) => void;
  onSavePreset: (name: string, parameters: ModelParameters) => void;
  currentParameters: ModelParameters;
}

const ParameterPresetSelector: React.FC<ParameterPresetSelectorProps> = ({
  presets,
  onSelectPreset,
  onSavePreset,
  currentParameters,
}) => {
  const [savePresetVisible, setSavePresetVisible] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSavePreset = () => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim(), currentParameters);
      setSavePresetVisible(false);
      setPresetName('');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Select
        className="flex-1"
        placeholder="选择参数预设"
        onChange={(value) => {
          const preset = presets.find(p => p.id === value);
          if (preset) {
            onSelectPreset(preset);
          }
        }}
        allowClear
      >
        {presets.map(preset => (
          <Select.Option key={preset.id} value={preset.id}>
            {preset.name}
          </Select.Option>
        ))}
      </Select>

      <Button
        icon={<SaveOutlined />}
        onClick={() => setSavePresetVisible(true)}
      >
        保存为预设
      </Button>

      <Modal
        title="保存参数预设"
        open={savePresetVisible}
        onOk={handleSavePreset}
        onCancel={() => setSavePresetVisible(false)}
        okButtonProps={{ disabled: !presetName.trim() }}
      >
        <div className="space-y-4">
          <Input
            placeholder="输入预设名称"
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
          />
          <div className="text-sm text-gray-500">
            将当前的参数设置保存为预设，方便以后快速应用
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ParameterPresetSelector;