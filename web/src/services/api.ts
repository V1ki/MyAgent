// Import all types from the dedicated types file
import {
  ApiKey,
  ModelProvider,
  Model,
  ModelImplementation,
  FrontendModelProvider,
  FrontendModelImplementation
} from '../types/api';
import { convertToCamelCase, convertToSnakeCase } from './utils';

// Define the base URL for API calls
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:18000';

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


// NEW: Generic API service factory
function createApiService<T, F = T>(options: {
  basePath: string,
  subResourcePath?: string
}) {
  const { basePath, subResourcePath } = options;

  const transformResponse = (data: T | T[]): F | F[] => {
    return Array.isArray(data) 
      ? data.map(item => convertToCamelCase(item)) 
      : convertToCamelCase(data);
  };

  return {
    getAll: async (parentId?: string): Promise<F[]> => {
      const path = parentId ? `${basePath}/${parentId}${subResourcePath || ''}` : basePath;
      const data = await fetchAPI(path);
      return transformResponse(data) as F[];
    },
    
    getOne: async (id: string): Promise<F> => {
      const data = await fetchAPI(`${basePath}/${id}`);
      return transformResponse(data) as F;
    },
    
    create: async (item: Partial<F>, parentId?: string): Promise<F> => {
      const path = parentId ? `${basePath}/${parentId}${subResourcePath || ''}` : basePath;
      const payload = convertToSnakeCase({...item, id: ''} as any) ;
      const data = await fetchAPI(path, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return transformResponse(data) as F;
    },
    
    update: async (id: string, item: Partial<F>, parentId?: string): Promise<F> => {
      const payload = convertToSnakeCase({...item, id} as any);
      const path = parentId ? `${basePath}/${parentId}${subResourcePath || ''}` : basePath;
      const data = await fetchAPI(`${path}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return transformResponse(data) as F;
    },
    
    delete: async (id: string, parentId?: string): Promise<void> => {
      const path = parentId ? `${basePath}/${parentId}${options.subResourcePath || ''}` : basePath;
      await fetchAPI(`${path}/${id}`, {
        method: 'DELETE'
      });
    }
  };
}



// Provider API endpoints
export const providerService = {
  ...createApiService<ModelProvider, FrontendModelProvider>({ basePath: '/providers' }),

  // Custom methods specific to providers
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
  }
};

// API keys endpoints
export const apiKeyService = createApiService<ApiKey>({ 
  basePath: '/providers',
  subResourcePath: '/keys'
});


// Model service
export const modelService = {
  ...createApiService<Model, Model>({
    basePath: '/models'
  }),
  
  // Model implementations
  implementations: {
    ...createApiService<ModelImplementation, FrontendModelImplementation>({
      basePath: '/models',  
      subResourcePath: '/implementations'
    })
  }
};
