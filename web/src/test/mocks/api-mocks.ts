import { ModelProvider, ApiKey } from '../../services/api';
import { vi } from 'vitest';

// Mock data for providers
export const mockProviders: ModelProvider[] = [
  { 
    id: '1', 
    name: 'OpenAI', 
    base_url: 'https://api.openai.com',
    description: 'OpenAI GPT-series models API provider',
    api_keys: [
      { id: '101', provider_id: '1', alias: '默认', key_preview: 'sk-***********' },
      { id: '102', provider_id: '1', alias: '高级账户', key_preview: 'sk-***********' }
    ]
  },
  { 
    id: '2', 
    name: 'Anthropic', 
    base_url: 'https://api.anthropic.com',
    description: 'Claude model series API provider',
    api_keys: [
      { id: '201', provider_id: '2', alias: '默认', key_preview: 'sk-***********' }
    ]
  },
];

// Create a deep copy of the data to avoid test interference
const getProvidersCopy = () => JSON.parse(JSON.stringify(mockProviders));

// Mock implementation for provider service
export const mockProviderService = {
  getProviders: vi.fn().mockImplementation(async () => {
    return getProvidersCopy();
  }),
  
  getProvider: vi.fn().mockImplementation(async (id: string) => {
    const provider = getProvidersCopy().find(p => p.id === id);
    if (!provider) {
      throw new Error(`Provider with ID ${id} not found`);
    }
    return provider;
  }),
  
  createProvider: vi.fn().mockImplementation(async (provider: Partial<ModelProvider>, initialKey?: { alias: string, key: string }) => {
    const newProvider: ModelProvider = {
      id: `provider-${Date.now()}`,
      name: provider.name || '',
      base_url: provider.base_url || '',
      description: provider.description,
      api_keys: []
    };
    
    if (initialKey) {
      newProvider.api_keys = [{
        id: `key-${Date.now()}`,
        provider_id: newProvider.id,
        alias: initialKey.alias,
        key_preview: 'sk-***********'
      }];
    }
    
    mockProviders.push(newProvider);
    return newProvider;
  }),
  
  updateProvider: vi.fn().mockImplementation(async (id: string, provider: Partial<ModelProvider>) => {
    const index = mockProviders.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Provider with ID ${id} not found`);
    }
    
    mockProviders[index] = {
      ...mockProviders[index],
      name: provider.name || mockProviders[index].name,
      base_url: provider.base_url || mockProviders[index].base_url,
      description: provider.description !== undefined ? provider.description : mockProviders[index].description
    };
    
    return mockProviders[index];
  }),
  
  deleteProvider: vi.fn().mockImplementation(async (id: string) => {
    const index = mockProviders.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Provider with ID ${id} not found`);
    }
    
    mockProviders.splice(index, 1);
  }),
};

// Mock implementation for API key service
export const mockApiKeyService = {
  getApiKeys: vi.fn().mockImplementation(async (providerId: string) => {
    const provider = mockProviders.find(p => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }
    return provider.api_keys || [];
  }),
  
  createApiKey: vi.fn().mockImplementation(async (providerId: string, apiKey: Partial<ApiKey>) => {
    const provider = mockProviders.find(p => p.id === providerId);
    if (!provider) {
      throw new Error(`Provider with ID ${providerId} not found`);
    }
    
    const newKey = {
      id: `key-${Date.now()}`,
      provider_id: providerId,
      alias: apiKey.alias || '',
      key_preview: 'sk-***********'
    };
    
    if (!provider.api_keys) {
      provider.api_keys = [];
    }
    
    provider.api_keys.push(newKey);
    return newKey;
  }),
  
  updateApiKey: vi.fn().mockImplementation(async (keyId: string, apiKey: Partial<ApiKey>) => {
    for (const provider of mockProviders) {
      if (!provider.api_keys) continue;
      
      const keyIndex = provider.api_keys.findIndex(k => k.id === keyId);
      if (keyIndex !== -1) {
        provider.api_keys[keyIndex] = {
          ...provider.api_keys[keyIndex],
          alias: apiKey.alias || provider.api_keys[keyIndex].alias,
          // We don't update key_preview as that would be handled by the backend
        };
        return provider.api_keys[keyIndex];
      }
    }
    
    throw new Error(`API key with ID ${keyId} not found`);
  }),
  
  deleteApiKey: vi.fn().mockImplementation(async (keyId: string) => {
    for (const provider of mockProviders) {
      if (!provider.api_keys) continue;
      
      const keyIndex = provider.api_keys.findIndex(k => k.id === keyId);
      if (keyIndex !== -1) {
        provider.api_keys.splice(keyIndex, 1);
        return;
      }
    }
    
    throw new Error(`API key with ID ${keyId} not found`);
  }),
};

// Reset the mock data and implementation counters
export const resetMocks = () => {
  // Clear the providers array and add back the original data
  mockProviders.length = 0;
  mockProviders.push(...getProvidersCopy());
  
  // Reset the mock function calls
  vi.clearAllMocks();
};