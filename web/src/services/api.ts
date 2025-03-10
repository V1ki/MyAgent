// Import all types from the dedicated types file
import {
  ApiKey,
  ModelProvider,
  Model,
  ModelImplementation,
  FrontendModel,
  FrontendModelImplementation,
  ConversationCreate,
  ConversationRead,
  ConversationDetailedRead,
  ConversationTurnCreate,
  ConversationTurnRead,
  ConversationTurnDetailedRead,
  ParameterPresetCreate,
  ParameterPresetRead,
  MultiModelChatRequest,
  MultiModelChatResponse,
} from '../types/api';

// Define the base URL for API calls
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper function for fetch requests
const fetchAPI = async (endpoint: string, options: RequestInit = {}): Promise<any> => {
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };
  
  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.detail || error.message || 'API request failed');
  }
  
  // For DELETE requests that return 204 No Content
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

// Helper functions to convert between backend and frontend formats
const toFrontendModel = (model: Model): FrontendModel => {
  return {
    ...model,
    id: model.id,
  };
};

const toFrontendModelImplementation = (implementation: ModelImplementation): FrontendModelImplementation => {
  return {
    id: implementation.id,
    providerId: implementation.provider_id,
    modelId: implementation.model_id,
    providerModelId: implementation.provider_model_id,
    version: implementation.version,
    contextWindow: implementation.context_window,
    pricingInfo: implementation.pricing_info ? {
      currency: implementation.pricing_info.currency,
      billingMode: implementation.pricing_info.billing_mode,
      inputPrice: implementation.pricing_info.input_price,
      outputPrice: implementation.pricing_info.output_price,
      requestPrice: implementation.pricing_info.request_price,
      minutePrice: implementation.pricing_info.minute_price,
      minimumCharge: implementation.pricing_info.minimum_charge,
      effectiveDate: implementation.pricing_info.effective_date,
      notes: implementation.pricing_info.notes,
      tiers: implementation.pricing_info.tiers?.map(tier => ({
        tierName: tier.tier_name,
        volumeThreshold: tier.volume_threshold,
        inputPrice: tier.input_price,
        outputPrice: tier.output_price,
        requestPrice: tier.request_price,
      })),
      specialFeatures: implementation.pricing_info.special_features?.map(feature => ({
        featureName: feature.feature_name,
        additionalPrice: feature.additional_price,
        priceUnit: feature.price_unit,
      })),
      freeAllowance: implementation.pricing_info.free_allowance ? {
        tokens: implementation.pricing_info.free_allowance.tokens,
        requests: implementation.pricing_info.free_allowance.requests,
        validPeriod: implementation.pricing_info.free_allowance.valid_period,
      } : undefined,
    } : undefined,
    isAvailable: implementation.is_available,
    customParameters: implementation.custom_parameters,
  };
};

const toBackendModel = (model: FrontendModel): Model => {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    capabilities: model.capabilities,
    family: model.family,
  };
};

const toBackendModelImplementation = (implementation: FrontendModelImplementation): ModelImplementation => {
  return {
    id: implementation.id,
    provider_id: implementation.providerId,
    model_id: implementation.modelId,
    provider_model_id: implementation.providerModelId,
    version: implementation.version,
    context_window: implementation.contextWindow,
    pricing_info: implementation.pricingInfo ? {
      currency: implementation.pricingInfo.currency,
      billing_mode: implementation.pricingInfo.billingMode,
      input_price: implementation.pricingInfo.inputPrice,
      output_price: implementation.pricingInfo.outputPrice,
      request_price: implementation.pricingInfo.requestPrice,
      minute_price: implementation.pricingInfo.minutePrice,
      minimum_charge: implementation.pricingInfo.minimumCharge,
      effective_date: implementation.pricingInfo.effectiveDate,
      notes: implementation.pricingInfo.notes,
      tiers: implementation.pricingInfo.tiers?.map(tier => ({
        tier_name: tier.tierName,
        volume_threshold: tier.volumeThreshold,
        input_price: tier.inputPrice,
        output_price: tier.outputPrice,
        request_price: tier.requestPrice,
      })),
      special_features: implementation.pricingInfo.specialFeatures?.map(feature => ({
        feature_name: feature.featureName,
        additional_price: feature.additionalPrice,
        price_unit: feature.priceUnit,
      })),
      free_allowance: implementation.pricingInfo.freeAllowance ? {
        tokens: implementation.pricingInfo.freeAllowance.tokens,
        requests: implementation.pricingInfo.freeAllowance.requests,
        valid_period: implementation.pricingInfo.freeAllowance.validPeriod,
      } : undefined,
    } : undefined,
    is_available: implementation.isAvailable,
    custom_parameters: implementation.customParameters,
  };
};

// Provider API endpoints
export const providerService = {
  // Get all providers
  getProviders: async (): Promise<ModelProvider[]> => {
    return fetchAPI('/providers/');
  },

  // Get a specific provider with API keys
  getProvider: async (id: string): Promise<ModelProvider> => {
    return fetchAPI(`/providers/${id}`);
  },

  // Create a new provider
  createProvider: async (provider: Partial<ModelProvider>, initialKey?: { alias: string, key: string }): Promise<ModelProvider> => {
    const payload = {
      name: provider.name,
      base_url: provider.base_url,
      description: provider.description,
      initial_api_key: initialKey ? {
        alias: initialKey.alias,
        key: initialKey.key
      } : undefined
    };
    
    return fetchAPI('/providers/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Update a provider
  updateProvider: async (id: string, provider: Partial<ModelProvider>): Promise<ModelProvider> => {
    const payload = {
      name: provider.name,
      base_url: provider.base_url,
      description: provider.description,
    };
    
    return fetchAPI(`/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  // Delete a provider
  deleteProvider: async (id: string): Promise<void> => {
    return fetchAPI(`/providers/${id}`, {
      method: 'DELETE'
    });
  },
};

// API keys endpoints
export const apiKeyService = {
  // Get all API keys for a provider
  getApiKeys: async (providerId: string): Promise<ApiKey[]> => {
    return fetchAPI(`/providers/${providerId}/keys`);
  },

  // Create a new API key
  createApiKey: async (providerId: string, apiKey: Partial<ApiKey>): Promise<ApiKey> => {
    const payload = {
      alias: apiKey.alias,
      key: apiKey.key,
    };
    
    return fetchAPI(`/providers/${providerId}/keys`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Update an API key
  updateApiKey: async (keyId: string, apiKey: Partial<ApiKey>): Promise<ApiKey> => {
    const payload = {
      alias: apiKey.alias,
      key: apiKey.key,
    };
    
    return fetchAPI(`/keys/${keyId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  // Delete an API key
  deleteApiKey: async (keyId: string): Promise<void> => {
    return fetchAPI(`/keys/${keyId}`, {
      method: 'DELETE'
    });
  },
};

// Model service
export const modelService = {
  // Get all models
  getModels: async (): Promise<FrontendModel[]> => {
    const data = await fetchAPI('/models');
    return data.map(toFrontendModel);
  },

  // Get a specific model
  getModel: async (id: string): Promise<FrontendModel> => {
    const data = await fetchAPI(`/models/${id}`);
    return toFrontendModel(data);
  },

  // Create a new model
  createModel: async (model: Omit<FrontendModel, 'id'>): Promise<FrontendModel> => {
    const data = await fetchAPI('/models', {
      method: 'POST',
      body: JSON.stringify(model),
    });
    return toFrontendModel(data);
  },

  // Update an existing model
  updateModel: async (id: string, model: Partial<FrontendModel>): Promise<FrontendModel> => {
    const data = await fetchAPI(`/models/${id}`, {
      method: 'PUT',
      body: JSON.stringify(model),
    });
    return toFrontendModel(data);
  },

  // Delete a model
  deleteModel: async (id: string): Promise<void> => {
    await fetchAPI(`/models/${id}`, {
      method: 'DELETE',
    });
  },

  // Get model implementations
  getModelImplementations: async (modelId: string): Promise<FrontendModelImplementation[]> => {
    const data = await fetchAPI(`/models/${modelId}/implementations`);
    return data.map(toFrontendModelImplementation);
  },

  // Get a specific model implementation
  getModelImplementation: async (id: string): Promise<FrontendModelImplementation> => {
    const data = await fetchAPI(`/models/implementations/${id}`);
    return toFrontendModelImplementation(data);
  },

  // Create a new model implementation
  createModelImplementation: async (modelId: string, implementation: Omit<FrontendModelImplementation, 'id'>): Promise<FrontendModelImplementation> => {
    const backendImpl = toBackendModelImplementation({
      ...implementation,
      id: ''
    });
    const data = await fetchAPI(`/models/${modelId}/implementations`, {
      method: 'POST',
      body: JSON.stringify(backendImpl),
    });
    return toFrontendModelImplementation(data);
  },

  // Update an existing model implementation
  updateModelImplementation: async (id: string, implementation: Partial<FrontendModelImplementation>): Promise<FrontendModelImplementation> => {
    const backendImpl = toBackendModelImplementation({ ...implementation, id } as FrontendModelImplementation);
    const data = await fetchAPI(`/models/implementations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(backendImpl),
    });
    return toFrontendModelImplementation(data);
  },

  // Delete a model implementation
  deleteModelImplementation: async (id: string): Promise<void> => {
    await fetchAPI(`/models/implementations/${id}`, {
      method: 'DELETE',
    });
  },
};

// Conversation and Chat service
export const conversationService = {
  // Get all conversations
  getConversations: async (skip = 0, limit = 100): Promise<ConversationRead[]> => {
    return fetchAPI(`/conversations/?skip=${skip}&limit=${limit}`);
  },

  // Get a specific conversation with details
  getConversation: async (id: string): Promise<ConversationDetailedRead> => {
    return fetchAPI(`/conversations/${id}`);
  },

  // Create a new conversation
  createConversation: async (conversation: ConversationCreate): Promise<ConversationRead> => {
    return fetchAPI('/conversations/', {
      method: 'POST',
      body: JSON.stringify(conversation)
    });
  },

  // Update a conversation
  updateConversation: async (id: string, conversation: Partial<ConversationCreate>): Promise<ConversationRead> => {
    return fetchAPI(`/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(conversation)
    });
  },

  // Delete a conversation
  deleteConversation: async (id: string): Promise<void> => {
    return fetchAPI(`/conversations/${id}`, {
      method: 'DELETE'
    });
  },

  // Get conversation turns
  getConversationTurns: async (conversationId: string, skip = 0, limit = 100): Promise<ConversationTurnRead[]> => {
    return fetchAPI(`/conversations/${conversationId}/turns?skip=${skip}&limit=${limit}`);
  },

  // Get a specific turn with details
  getConversationTurn: async (conversationId: string, turnId: string): Promise<ConversationTurnDetailedRead> => {
    return fetchAPI(`/conversations/${conversationId}/turns/${turnId}`);
  },

  // Create a new turn
  createConversationTurn: async (conversationId: string, turn: ConversationTurnCreate): Promise<ConversationTurnRead> => {
    return fetchAPI(`/conversations/${conversationId}/turns`, {
      method: 'POST',
      body: JSON.stringify(turn)
    });
  },

  // Delete a turn (soft delete)
  deleteConversationTurn: async (conversationId: string, turnId: string): Promise<ConversationTurnRead> => {
    return fetchAPI(`/conversations/${conversationId}/turns/${turnId}`, {
      method: 'DELETE'
    });
  },

  // Get parameter presets
  getParameterPresets: async (skip = 0, limit = 100): Promise<ParameterPresetRead[]> => {
    return fetchAPI(`/conversations/parameter-presets?skip=${skip}&limit=${limit}`);
  },

  // Create a parameter preset
  createParameterPreset: async (preset: ParameterPresetCreate): Promise<ParameterPresetRead> => {
    return fetchAPI('/conversations/parameter-presets', {
      method: 'POST',
      body: JSON.stringify(preset)
    });
  },

  // Delete a parameter preset
  deleteParameterPreset: async (id: string): Promise<void> => {
    return fetchAPI(`/conversations/parameter-presets/${id}`, {
      method: 'DELETE'
    });
  },
};

// Multi-model chat service
export const chatService = {
  // Send a message to multiple models
  sendMultiModelMessage: async (request: MultiModelChatRequest): Promise<MultiModelChatResponse> => {
    return fetchAPI('/chat/multi', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  // Stream a message to multiple models
  streamMultiModelMessage: (
    conversationId: string,
    modelIds: string[],
    message: string,
    parameters?: Record<string, any>
  ): EventSource => {
    const params = new URLSearchParams({
      conversation_id: conversationId,
      models: modelIds.join(','),
      message
    });
    if (parameters) {
      params.append('parameters', JSON.stringify(parameters));
    }
    
    return new EventSource(`${BASE_URL}/chat/multi/stream?${params.toString()}`);
  },

  // Select a response as context
  selectResponseAsContext: async (turnId: string, responseId: string): Promise<{ status: string; selected_response_id: string }> => {
    return fetchAPI(`/chat/turns/${turnId}/select-response/${responseId}`, {
      method: 'PUT'
    });
  },
};