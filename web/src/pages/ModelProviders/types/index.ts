// filepath: /Users/v1ki/Documents/projs/work/my_agent/web/src/pages/ModelProviders/types/index.ts
import { ApiKey, ModelProvider } from '../../../services/api';

// Interface for frontend components (maps backend data to frontend format)
export interface FrontendApiKey {
  id: string;
  alias: string;
  key: string;
}

export interface FrontendModelProvider {
  id: string;
  name: string;
  baseUrl: string;
  description?: string;
  apiKeys: FrontendApiKey[];
  apiKeysCount: number;
}

// Helper function to convert backend data to frontend format
export const toFrontendProvider = (provider: ModelProvider): FrontendModelProvider => ({
  id: provider.id,
  name: provider.name,
  baseUrl: provider.base_url,
  description: provider.description,
  apiKeys: provider.api_keys?.map(key => ({
    id: key.id,
    alias: key.alias,
    key: key.key_preview || '••••••••••••••••'
  })) || [],
  apiKeysCount: provider.api_keys_count || 0
});