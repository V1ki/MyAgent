// Define the base URL for API calls
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Define TypeScript interfaces based on backend schemas
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
  base_url: string; // Note: snake_case from backend
  description?: string;
  api_keys?: ApiKey[]; // Only included in detailed responses
}

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
      initial_key: initialKey ? {
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