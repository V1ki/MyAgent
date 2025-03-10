import { useState, useEffect, useRef } from 'react';
import { conversationService } from '../../../services/api';
import { ParameterPreset } from '../types';

// Default parameters
export const defaultParameters = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 2048,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

/**
 * Hook for managing parameter presets
 */
export const useParameterPresets = () => {
  const [presets, setPresets] = useState<ParameterPreset[]>([]);
  const [currentParameters, setCurrentParameters] = useState(defaultParameters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          parameters: preset.parameters as typeof defaultParameters
        }));
        
        setPresets(frontendPresets);
      } catch (err) {
        console.error('Failed to load parameter presets:', err);
        setError('Failed to load parameter presets');
      } finally {
        setLoading(false);
      }
    };

    fetchPresets();
  }, []);

  // Select a preset
  const selectPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setCurrentParameters({
        temperature: preset.parameters.temperature || defaultParameters.temperature,
        topP: preset.parameters.topP || defaultParameters.topP,
        maxTokens: preset.parameters.maxTokens || defaultParameters.maxTokens,
        frequencyPenalty: preset.parameters.frequencyPenalty || defaultParameters.frequencyPenalty,
        presencePenalty: preset.parameters.presencePenalty || defaultParameters.presencePenalty,
      });
      return true;
    }
    return false;
  };

  // Create a new preset
  const createPreset = async (name: string, description?: string) => {
    setLoading(true);
    
    try {
      // Save preset to the API
      const newPreset = await conversationService.createParameterPreset({
        name,
        description,
        parameters: currentParameters
      });
      
      // Add to the local state
      const frontendPreset: ParameterPreset = {
        id: newPreset.id,
        name: newPreset.name,
        description: newPreset.description,
        parameters: newPreset.parameters as typeof defaultParameters
      };
      
      setPresets([...presets, frontendPreset]);
      return true;
    } catch (err) {
      console.error('Failed to create parameter preset:', err);
      setError('Failed to create parameter preset');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update current parameters
  const updateParameters = (params: Partial<typeof defaultParameters>) => {
    setCurrentParameters(prev => ({
      ...prev,
      ...params
    }));
  };

  // Reset parameters to defaults
  const resetParameters = () => {
    setCurrentParameters(defaultParameters);
  };

  return {
    presets,
    currentParameters,
    loading,
    error,
    selectPreset,
    createPreset,
    updateParameters,
    resetParameters
  };
};