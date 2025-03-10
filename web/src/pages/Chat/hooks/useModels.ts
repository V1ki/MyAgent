import { useState, useEffect, useRef } from 'react';
import { modelService } from '../../../services/api';
import { ModelOption } from '../types';

/**
 * Hook for managing models and model selection
 */
export const useModels = () => {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // Fetch available models
  useEffect(() => {
    if (initialized.current) return;
    
    const fetchModels = async () => {
      setLoading(true);
      
      try {
        // Get all models
        const apiModels = await modelService.getModels();
        const modelOptions: ModelOption[] = [];
        
        // Get implementations for each model
        for (const model of apiModels) {
          try {
            const implementations = await modelService.getModelImplementations(model.id);
            
            // Add each implementation as a selectable option
            implementations.forEach(impl => {
              modelOptions.push({
                id: impl.id,
                name: `${model.name} (${impl.version})`,
                providerId: impl.providerId,
                providerName: impl.providerId // Simplified; ideally should fetch provider name
              });
            });
          } catch (err) {
            console.error(`Failed to load implementations for model ${model.id}:`, err);
          }
        }
        
        setModels(modelOptions);
        
        // Pre-select the first model if available
        if (modelOptions.length > 0 && selectedModelIds.length === 0) {
          setSelectedModelIds([modelOptions[0].id]);
        }
        
        initialized.current = true;
      } catch (err) {
        console.error('Failed to load models:', err);
        setError('Failed to load available models');
      } finally {
        setLoading(false);
      }
    };
    
    fetchModels();
  }, []);

  // Select models
  const selectModels = (modelIds: string[]) => {
    setSelectedModelIds(modelIds);
  };

  // Add model to selection
  const addModel = (modelId: string) => {
    if (!selectedModelIds.includes(modelId)) {
      setSelectedModelIds([...selectedModelIds, modelId]);
    }
  };

  // Remove model from selection
  const removeModel = (modelId: string) => {
    setSelectedModelIds(selectedModelIds.filter(id => id !== modelId));
  };

  // Toggle model selection
  const toggleModel = (modelId: string) => {
    if (selectedModelIds.includes(modelId)) {
      removeModel(modelId);
    } else {
      addModel(modelId);
    }
  };

  return {
    models,
    selectedModelIds,
    loading,
    error,
    selectModels,
    addModel,
    removeModel,
    toggleModel
  };
};