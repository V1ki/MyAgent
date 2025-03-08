import React, { useState } from 'react';
import { Drawer, Slider, InputNumber, Button, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import ParameterPresetSelector from './ParameterPresetSelector';
import { mockParameterPresets } from '../mockData';

interface ModelParameters {
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface SettingsPanelProps {
  open: boolean;
  parameters: ModelParameters;
  onClose: () => void;
  onSave: (parameters: ModelParameters) => void;
  onSaveAsPreset: (parameters: ModelParameters) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  open,
  parameters,
  onClose,
  onSave,
  onSaveAsPreset,
}) => {
  const [currentParams, setCurrentParams] = useState<ModelParameters>(parameters);
  const [saving, setSaving] = useState(false);

  // 重置为原始参数
  const handleReset = () => {
    setCurrentParams(parameters);
  };

  // 处理保存参数
  const handleSave = () => {
    onSave(currentParams);
  };

  // 处理保存为预设
  const handleSavePreset = (name: string, params: ModelParameters) => {
    setSaving(true);
    // TODO: 实际保存到后端
    onSaveAsPreset(params);
    setSaving(false);
  };

  // 处理选择预设
  const handleSelectPreset = (preset: { parameters: ModelParameters }) => {
    setCurrentParams(preset.parameters);
  };

  return (
    <Drawer
      title="生成参数设置"
      placement="right"
      width={400}
      open={open}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" onClick={handleSave}>
            应用
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Parameter Preset Selector */}
        <div className="pb-4 border-b">
          <ParameterPresetSelector
            presets={mockParameterPresets}
            currentParameters={currentParams}
            onSelectPreset={handleSelectPreset}
            onSavePreset={handleSavePreset}
          />
        </div>

        {/* Temperature */}
        <div>
          <div className="flex justify-between mb-2">
            <span>Temperature</span>
            <InputNumber
              aria-label='Temperature'
              min={0}
              max={2}
              step={0.1}
              value={currentParams.temperature}
              onChange={(value) => setCurrentParams(prev => ({ ...prev, temperature: value || 0 }))}
              style={{ width: '80px' }}
            />
          </div>
          <Slider
            min={0}
            max={2}
            step={0.1}
            value={currentParams.temperature}
            onChange={(value) => setCurrentParams(prev => ({ ...prev, temperature: value }))}
          />
          <div className="text-xs text-gray-500">
            较高的值会使输出更加随机，较低的值会使输出更加集中和确定
          </div>
        </div>

        {/* Top P */}
        <div>
          <div className="flex justify-between mb-2">
            <span>Top P</span>
            <InputNumber
              aria-label='Top P'
              min={0}
              max={1}
              step={0.1}
              value={currentParams.topP}
              onChange={(value) => setCurrentParams(prev => ({ ...prev, topP: value || 0 }))}
              style={{ width: '80px' }}
            />
          </div>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={currentParams.topP}
            onChange={(value) => setCurrentParams(prev => ({ ...prev, topP: value }))}
          />
          <div className="text-xs text-gray-500">
            核采样阈值，控制模型从累积概率超过此值的tokens中进行选择
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <div className="flex justify-between mb-2">
            <span>最大Token数</span>
            <InputNumber
              aria-label='最大Token数'
              min={1}
              max={4096}
              value={currentParams.maxTokens}
              onChange={(value) => setCurrentParams(prev => ({ ...prev, maxTokens: value || 1 }))}
              style={{ width: '100px' }}
            />
          </div>
          <div className="text-xs text-gray-500">
            限制模型在一次对话中生成的最大token数量
          </div>
        </div>

        {/* Frequency Penalty */}
        <div>
          <div className="flex justify-between mb-2">
            <span>频率惩罚</span>
            <InputNumber
              aria-label='频率惩罚'
              min={-2}
              max={2}
              step={0.1}
              value={currentParams.frequencyPenalty}
              onChange={(value) => setCurrentParams(prev => ({ ...prev, frequencyPenalty: value || 0 }))}
              style={{ width: '80px' }}
            />
          </div>
          <Slider
            min={-2}
            max={2}
            step={0.1}
            value={currentParams.frequencyPenalty}
            onChange={(value) => setCurrentParams(prev => ({ ...prev, frequencyPenalty: value }))}
          />
          <div className="text-xs text-gray-500">
            减少模型重复使用相同词语的倾向
          </div>
        </div>

        {/* Presence Penalty */}
        <div>
          <div className="flex justify-between mb-2">
            <span>存在惩罚</span>
            <InputNumber
              aria-label='存在惩罚'
              min={-2}
              max={2}
              step={0.1}
              value={currentParams.presencePenalty}
              onChange={(value) => setCurrentParams(prev => ({ ...prev, presencePenalty: value || 0 }))}
              style={{ width: '80px' }}
            />
          </div>
          <Slider
            min={-2}
            max={2}
            step={0.1}
            value={currentParams.presencePenalty}
            onChange={(value) => setCurrentParams(prev => ({ ...prev, presencePenalty: value }))}
          />
          <div className="text-xs text-gray-500">
            减少模型重复讨论相同主题的倾向
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default SettingsPanel;