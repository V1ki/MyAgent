// Provider interfaces
export interface ApiKey {
  id: string;
  provider_id: string;
  alias: string;
  key_preview?: string;
  key?: string; // Used only when creating/updating
}

export interface ModelProvider {
  id: string;
  name: string;
  base_url: string;
  description?: string;
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

// Chat interfaces 
export interface ConversationCreate {
  title: string;
  system_prompt?: string;
  user_id?: string;
}

export interface ConversationRead {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  system_prompt?: string;
  user_id?: string;
}

export interface ConversationDetailedRead extends ConversationRead {
  turns: ConversationTurnRead[];
}

export interface ConversationTurnCreate {
  conversation_id: string;
  user_input: string;
  model_parameters?: Record<string, any>;
}

export interface ConversationTurnRead {
  id: string;
  conversation_id: string;
  user_input: string;
  created_at: string;
  modified_at: string;
  is_deleted: boolean;
  model_parameters?: Record<string, any>;
  active_response_id?: string;
}

export interface ConversationTurnDetailedRead extends ConversationTurnRead {
  responses: ModelResponseRead[];
  input_versions: UserInputVersionRead[];
}

export interface UserInputVersionCreate {
  content: string;
  model_parameters?: Record<string, any>;
}

export interface UserInputVersionRead {
  id: string;
  turn_id: string;
  content: string;
  created_at: string;
  model_parameters?: Record<string, any>;
  is_current: boolean;
}

export interface ModelResponseCreate {
  model_implementation_id: string;
  content: string;
  metadata?: Record<string, any>;
  input_version_id?: string;
}

export interface ModelResponseRead {
  id: string;
  turn_id: string;
  model_implementation_id: string;
  model_implementation: ModelImplementation;
  content: string;
  created_at: string;
  is_selected: boolean;
  is_deleted: boolean;
  metadata?: Record<string, any>;
  input_version_id?: string;
}

export interface ParameterPresetCreate {
  name: string;
  description?: string;
  user_id?: string;
  parameters: Record<string, any>;
  model_implementation_id?: string;
}

export interface ParameterPresetRead {
  id: string;
  name: string;
  description?: string;
  user_id?: string;
  parameters: Record<string, any>;
  model_implementation_id?: string;
  created_at: string;
}

export interface MultiModelChatRequest {
  conversation_id: string;
  model_implementations: string[];
  message: string;
  parameters?: Record<string, any>;
}

export interface MultiModelChatResponse {
  turn_id: string;
  responses: ModelResponseRead[];
}

export interface SelectResponseRequest {
  turn_id: string;
  response_id: string;
}
