import { ApiResponse } from './api';

// Model interfaces
export interface Model {
  id: string;
  name: string;
  description?: string;
  capabilities: string[];
  family: string;
}

export interface ModelImplementation {
  id: string;
  provider_id: string;
  model_id: string;
  provider_model_id: string;
  version: string;
  context_window?: number;
  pricing_info?: PricingInfo;
  is_available: boolean;
  custom_parameters?: Record<string, any>;
}

export interface PricingInfo {
  currency: string;
  billing_mode: "token" | "request" | "minute" | "hybrid";
  input_price?: number;
  output_price?: number;
  request_price?: number;
  minute_price?: number;
  tiers?: PricingTier[];
  special_features?: FeaturePricing[];
  free_allowance?: Allowance;
  minimum_charge?: number;
  effective_date?: string;
  notes?: string;
}

interface PricingTier {
  tier_name: string;
  volume_threshold: number;
  input_price?: number;
  output_price?: number;
  request_price?: number;
}

interface FeaturePricing {
  feature_name: string;
  additional_price: number;
  price_unit: string;
}

interface Allowance {
  tokens?: number;
  requests?: number;
  valid_period?: string;
}

// Frontend adapted interfaces (convert snake_case to camelCase)
export interface FrontendModel extends Omit<Model, 'id'> {
  id: string;
}

export interface FrontendModelImplementation {
  id: string;
  providerId: string;
  modelId: string;
  providerModelId: string;
  version: string;
  contextWindow?: number;
  pricingInfo?: FrontendPricingInfo;
  isAvailable: boolean;
  customParameters?: Record<string, any>;
}

export interface FrontendPricingInfo {
  currency: string;
  billingMode: "token" | "request" | "minute" | "hybrid";
  inputPrice?: number;
  outputPrice?: number;
  requestPrice?: number;
  minutePrice?: number;
  tiers?: FrontendPricingTier[];
  specialFeatures?: FrontendFeaturePricing[];
  freeAllowance?: FrontendAllowance;
  minimumCharge?: number;
  effectiveDate?: string;
  notes?: string;
}

interface FrontendPricingTier {
  tierName: string;
  volumeThreshold: number;
  inputPrice?: number;
  outputPrice?: number;
  requestPrice?: number;
}

interface FrontendFeaturePricing {
  featureName: string;
  additionalPrice: number;
  priceUnit: string;
}

interface FrontendAllowance {
  tokens?: number;
  requests?: number;
  validPeriod?: string;
}

// Helper functions to convert between backend and frontend formats
export function toFrontendModel(model: Model): FrontendModel {
  return {
    ...model,
    id: model.id,
  };
}

export function toFrontendModelImplementation(implementation: ModelImplementation): FrontendModelImplementation {
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
}

export function toBackendModel(model: FrontendModel): Model {
  return {
    id: model.id,
    name: model.name,
    description: model.description,
    capabilities: model.capabilities,
    family: model.family,
  };
}

export function toBackendModelImplementation(implementation: FrontendModelImplementation): ModelImplementation {
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
}

// Base URL for API
const API_BASE_URL = '/api';

// Model service
export const modelService = {
  // Get all models
  getModels: async (): Promise<FrontendModel[]> => {
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<Model[]> = await response.json();
    return data.data.map(toFrontendModel);
  },

  // Get a specific model
  getModel: async (id: string): Promise<FrontendModel> => {
    const response = await fetch(`${API_BASE_URL}/models/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<Model> = await response.json();
    return toFrontendModel(data.data);
  },

  // Create a new model
  createModel: async (model: Omit<FrontendModel, 'id'>): Promise<FrontendModel> => {
    const response = await fetch(`${API_BASE_URL}/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });
    if (!response.ok) {
      throw new Error(`Failed to create model: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<Model> = await response.json();
    return toFrontendModel(data.data);
  },

  // Update an existing model
  updateModel: async (id: string, model: Partial<FrontendModel>): Promise<FrontendModel> => {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(model),
    });
    if (!response.ok) {
      throw new Error(`Failed to update model: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<Model> = await response.json();
    return toFrontendModel(data.data);
  },

  // Delete a model
  deleteModel: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/models/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete model: ${response.status} ${response.statusText}`);
    }
  },

  // Get model implementations
  getModelImplementations: async (modelId: string): Promise<FrontendModelImplementation[]> => {
    const response = await fetch(`${API_BASE_URL}/models/${modelId}/implementations`);
    if (!response.ok) {
      throw new Error(`Failed to fetch model implementations: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<ModelImplementation[]> = await response.json();
    return data.data.map(toFrontendModelImplementation);
  },

  // Get a specific model implementation
  getModelImplementation: async (id: string): Promise<FrontendModelImplementation> => {
    const response = await fetch(`${API_BASE_URL}/model-implementations/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch model implementation: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<ModelImplementation> = await response.json();
    return toFrontendModelImplementation(data.data);
  },

  // Create a new model implementation
  createModelImplementation: async (implementation: Omit<FrontendModelImplementation, 'id'>): Promise<FrontendModelImplementation> => {
    const backendImpl = toBackendModelImplementation({...implementation, id: ''});
    const response = await fetch(`${API_BASE_URL}/model-implementations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendImpl),
    });
    if (!response.ok) {
      throw new Error(`Failed to create model implementation: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<ModelImplementation> = await response.json();
    return toFrontendModelImplementation(data.data);
  },

  // Update an existing model implementation
  updateModelImplementation: async (id: string, implementation: Partial<FrontendModelImplementation>): Promise<FrontendModelImplementation> => {
    const backendImpl = toBackendModelImplementation({...implementation, id} as FrontendModelImplementation);
    const response = await fetch(`${API_BASE_URL}/model-implementations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendImpl),
    });
    if (!response.ok) {
      throw new Error(`Failed to update model implementation: ${response.status} ${response.statusText}`);
    }
    const data: ApiResponse<ModelImplementation> = await response.json();
    return toFrontendModelImplementation(data.data);
  },

  // Delete a model implementation
  deleteModelImplementation: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/model-implementations/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete model implementation: ${response.status} ${response.statusText}`);
    }
  },
};