import { Drawer, Slider, InputNumber, Button, Space,Select,  Modal, Form, Input } from 'antd';
import { ParameterPreset , ModelParameters} from '../types';
import React, { useState, useEffect } from 'react';
import { SaveOutlined } from '@ant-design/icons';
import { conversationService } from '../../../services/api';


interface SettingsPanelProps {
  open: boolean;
  parameters: ModelParameters;
  onClose: () => void;
  onSave: (parameters: ModelParameters) => void;
  onSaveAsPreset: (parameters: ModelParameters) => void;
}

interface ParameterPresetSelectorProps {
  currentParameters: ModelParameters;
  onSelectPreset: (preset: ParameterPreset) => void;
  onSavePreset: (name: string, parameters: ModelParameters) => void;
}

const ParameterPresetSelector: React.FC<ParameterPresetSelectorProps> = ({
  currentParameters,
  onSelectPreset,
  onSavePreset,
}) => {
  const [presets, setPresets] = useState<ParameterPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Load presets from the API
  useEffect(() => {
    const fetchPresets = async () => {
      setLoading(true);
      try {
        const apiPresets = await conversationService.getParameterPresets();
        // Convert API format to frontend format
        const frontendPresets = apiPresets.map(preset => ({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          parameters: preset.parameters
        }));
        setPresets(frontendPresets);
      } catch (error) {
        console.error('Failed to load parameter presets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, []);

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    const selected = presets.find(preset => preset.id === presetId);
    if (selected) {
      onSelectPreset(selected);
    }
  };

  // Handle save preset modal
  const showSaveModal = () => {
    setModalVisible(true);
  };

  // Handle form submission
  const handleSave = async (values: { name: string; description?: string }) => {
    try {
      setLoading(true);
      
      const newPreset = {
        name: values.name,
        description: values.description,
        parameters: currentParameters
      };
      
      // Save preset to backend
      await conversationService.createParameterPreset({
        name: values.name,
        description: values.description,
        parameters: currentParameters
      });
      
      // Refresh presets list
      const apiPresets = await conversationService.getParameterPresets();
      const frontendPresets = apiPresets.map(preset => ({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        parameters: preset.parameters
      }));
      setPresets(frontendPresets);
      
      // Call the onSavePreset callback
      onSavePreset(values.name, currentParameters);
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to save preset:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center space-x-2">
        <Select
          loading={loading}
          style={{ width: '70%' }}
          placeholder="选择参数预设"
          onChange={handlePresetSelect}
          options={presets.map(preset => ({ value: preset.id, label: preset.name }))}
        />
        <Button icon={<SaveOutlined />} onClick={showSaveModal}>
          保存当前
        </Button>
      </div>

      <Modal
        title="保存参数预设"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="预设名称"
            rules={[{ required: true, message: '请输入预设名称' }]}
          >
            <Input placeholder="例如：创意写作" />
          </Form.Item>

          <Form.Item name="description" label="预设描述">
            <Input.TextArea
              placeholder="可选：描述这个预设的使用场景或特点"
              rows={3}
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setModalVisible(false)}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
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
    // Pass to parent which handles the API call
    onSaveAsPreset(params);
    setSaving(false);
  };

  // 处理选择预设
  const handleSelectPreset = (preset: ParameterPreset) => {
    // Convert the preset parameters to our ModelParameters format
    const presetParams = preset.parameters as ModelParameters;
    setCurrentParams({
      temperature: presetParams.temperature || 0.7,
      topP: presetParams.topP || 0.9,
      maxTokens: presetParams.maxTokens || 2048,
      frequencyPenalty: presetParams.frequencyPenalty || 0,
      presencePenalty: presetParams.presencePenalty || 0,
    });
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