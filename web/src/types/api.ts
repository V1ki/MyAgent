// Provider interfaces
export interface ApiKey {
  id: string;
  provider_id: string;
  alias: string;
  key_preview?: string;
  key?: string; // Used only when creating/updating
  sort_order: number;
}

// Free Quota types
export enum FreeQuotaType {
  CREDIT = "CREDIT",                    // 赠送金额
  SHARED_TOKENS = "SHARED_TOKENS",      // 共享的赠送Token数
  PER_MODEL_TOKENS = "PER_MODEL_TOKENS" // 每个模型独立的赠送Token数
}

export enum ResetPeriod {
  NEVER = "NEVER",     // 永不重置
  DAILY = "DAILY",     // 每天重置
  WEEKLY = "WEEKLY",   // 每周重置
  MONTHLY = "MONTHLY", // 每月重置
  YEARLY = "YEARLY"    // 每年重置
}

export interface FreeQuota {
  id: string;
  provider_id: string;
  model_implementation_id?: string;
  amount: number;
  reset_period: ResetPeriod;
}

export interface FreeQuotaUsage {
  id: string;
  api_key_id: string;
  free_quota_id: string;
  used_amount: number;
  last_reset_date?: string;
  next_reset_date?: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  base_url: string;
  description?: string;
  free_quota_type?: FreeQuotaType;
  free_quota?: FreeQuota;
  api_keys?: ApiKey[];
  api_keys_count?: number;
}

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

export interface PricingTier {
  tier_name: string;
  volume_threshold: number;
  input_price?: number;
  output_price?: number;
  request_price?: number;
}

export interface FeaturePricing {
  feature_name: string;
  additional_price: number;
  price_unit: string;
}

export interface Allowance {
  tokens?: number;
  requests?: number;
  valid_period?: string;
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
  sortOrder: number;
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

export interface FrontendPricingTier {
  tierName: string;
  volumeThreshold: number;
  inputPrice?: number;
  outputPrice?: number;
  requestPrice?: number;
}

export interface FrontendFeaturePricing {
  featureName: string;
  additionalPrice: number;
  priceUnit: string;
}

export interface FrontendAllowance {
  tokens?: number;
  requests?: number;
  validPeriod?: string;
}

export interface FrontendApiKey {
  id: string;
  alias: string;
  key: string;
  sort_order: number;
}

// Frontend interfaces for Free Quota
export interface FrontendFreeQuota {
  id: string;
  providerId: string;
  modelImplementationId?: string;
  amount: number;
  resetPeriod: ResetPeriod;
}

export interface FrontendFreeQuotaUsage {
  id: string;
  apiKeyId: string;
  freeQuotaId: string;
  usedAmount: number;
  lastResetDate?: string;
  nextResetDate?: string;
}

export interface FrontendModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  freeQuotaType?: FreeQuotaType;
  freeQuota?: FrontendFreeQuota;
  apiKeys: FrontendApiKey[];
  apiKeysCount: number;
}

// Helper function to convert backend data to frontend format
export const toFrontendProvider = (provider: ModelProvider): FrontendModelProvider => ({
  id: provider.id,
  name: provider.name,
  baseUrl: provider.base_url,
  description: provider.description,
  freeQuotaType: provider.free_quota_type,
  freeQuota: provider.free_quota? {
    id: provider.free_quota.id,
    providerId: provider.free_quota.provider_id,
    modelImplementationId: provider.free_quota.model_implementation_id,
    amount: provider.free_quota.amount,
    resetPeriod: provider.free_quota.reset_period
  } : undefined,
  apiKeys: [],
  apiKeysCount: provider.api_keys_count || 0
});