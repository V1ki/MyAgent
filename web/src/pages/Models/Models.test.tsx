import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithRouter } from '../../test/test-utils';

// Import mock services
import * as modelService from '../../services/model';
import * as apiService from '../../services/api';

// Mock the services
vi.mock('../../services/model', async () => {
  const actual = await vi.importActual('../../services/model');
  return {
    ...actual,
    modelService: {
      getModels: vi.fn(),
      getModel: vi.fn(),
      createModel: vi.fn(),
      updateModel: vi.fn(),
      deleteModel: vi.fn(),
      getModelImplementations: vi.fn(),
      getModelImplementation: vi.fn(),
      createModelImplementation: vi.fn(),
      updateModelImplementation: vi.fn(),
      deleteModelImplementation: vi.fn(),
    }
  };
});

vi.mock('../../services/api', async () => {
  const actual = await vi.importActual('../../services/api');
  return {
    ...actual,
    providerService: {
      getProviders: vi.fn(),
    }
  };
});

// Mock data for tests
const mockModels = [
  {
    id: '1',
    name: 'GPT-4o',
    description: 'OpenAI\'s multimodal model that can understand and process both text and images',
    capabilities: ['text-generation', 'function-calling', 'vision'],
    family: 'GPT-4',
  },
  {
    id: '2',
    name: 'Claude 3 Opus',
    description: 'Anthropic\'s most powerful model for highly complex tasks',
    capabilities: ['text-generation', 'function-calling'],
    family: 'Claude',
  },
];

const mockProviders = [
  {
    id: '1',
    name: 'OpenAI',
    base_url: 'https://api.openai.com',
    description: 'OpenAI API provider',
    api_keys_count: 2,
  },
  {
    id: '2',
    name: 'Anthropic',
    base_url: 'https://api.anthropic.com',
    description: 'Anthropic API provider',
    api_keys_count: 1,
  },
];

const mockImplementations = [
  {
    id: '1',
    providerId: '1',
    modelId: '1',
    providerModelId: 'gpt-4o',
    version: '2023-05',
    contextWindow: 128000,
    pricingInfo: {
      currency: 'USD',
      billingMode: 'token',
      inputPrice: 0.01,
      outputPrice: 0.03,
    },
    isAvailable: true,
  },
  {
    id: '2',
    providerId: '2',
    modelId: '2',
    providerModelId: 'claude-3-opus-20240229',
    version: '20240229',
    contextWindow: 200000,
    pricingInfo: {
      currency: 'USD',
      billingMode: 'token',
      inputPrice: 0.015,
      outputPrice: 0.075,
    },
    isAvailable: true,
  }
];

describe('Models Component', () => {
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Setup default mock returns
    modelService.modelService.getModels.mockResolvedValue(mockModels);
    apiService.providerService.getProviders.mockResolvedValue(mockProviders);
    modelService.modelService.getModelImplementations.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the models list', async () => {
    await renderWithRouter('/models');
    
    // Check if loading state is shown initially
    expect(screen.getByText('模型管理')).toBeInTheDocument();
    
    // Wait for the models to be loaded
    await waitFor(() => {
      expect(modelService.modelService.getModels).toHaveBeenCalledTimes(1);
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
      expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument();
    });
    
    // Check for model capabilities
    expect(screen.getAllByText('text-generation')).toHaveLength(2);
    expect(screen.getAllByText('function-calling')).toHaveLength(2);
    expect(screen.getByText('vision')).toBeInTheDocument();
  });

  it('shows error alert when API call fails', async () => {
    // Mock API failure
    modelService.modelService.getModels.mockRejectedValueOnce(new Error('API Error'));
    
    await renderWithRouter('/models');
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load models. Please try again later.')).toBeInTheDocument();
    });
  });

  it('opens add model modal and submits form', async () => {
    // Mock successful model creation
    modelService.modelService.createModel.mockResolvedValueOnce({
      id: '3',
      name: 'Test Model',
      description: 'Test model description',
      capabilities: ['text-generation'],
      family: 'Test',
    });

    await renderWithRouter('/models');
    
    // Click the Add Model button
    await waitFor(() => {
      fireEvent.click(screen.getByText('添加模型'));
    });
    
    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('例如: GPT-4o'), {
      target: { value: 'Test Model' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('添加模型描述'), {
      target: { value: 'Test model description' },
    });
    
    // Select capabilities
    const capabilitiesSelect = screen.getByPlaceholderText('选择模型能力');
    fireEvent.mouseDown(capabilitiesSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('文本生成'));
    });
    
    fireEvent.change(screen.getByPlaceholderText('例如: GPT-4, Claude, Gemini'), {
      target: { value: 'Test' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(modelService.modelService.createModel).toHaveBeenCalledWith({
        name: 'Test Model',
        description: 'Test model description',
        capabilities: ['text-generation'],
        family: 'Test',
      });
    });
  });

  it('edits a model', async () => {
    // Mock successful model update
    modelService.modelService.updateModel.mockResolvedValueOnce({
      id: '1',
      name: 'GPT-4o Updated',
      description: 'Updated description',
      capabilities: ['text-generation', 'function-calling'],
      family: 'GPT-4',
    });

    await renderWithRouter('/models');
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });
    
    // Click the edit button for GPT-4o
    const editButtons = screen.getAllByText('编辑');
    fireEvent.click(editButtons[0]);
    
    // Modify model name
    fireEvent.change(screen.getByDisplayValue('GPT-4o'), {
      target: { value: 'GPT-4o Updated' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(modelService.modelService.updateModel).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'GPT-4o Updated',
        })
      );
    });
  });

  it('deletes a model', async () => {
    // Mock successful model deletion
    modelService.modelService.deleteModel.mockResolvedValueOnce(undefined);
    
    await renderWithRouter('/models');
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });
    
    // Click the delete button for GPT-4o
    const deleteButtons = screen.getAllByText('删除');
    fireEvent.click(deleteButtons[0]);
    
    // Confirm deletion
    fireEvent.click(screen.getByText('是'));
    
    // Check if API was called with correct ID
    await waitFor(() => {
      expect(modelService.modelService.deleteModel).toHaveBeenCalledWith('1');
    });
  });

  it('navigates to model implementations page', async () => {
    // Mock successful implementation fetch
    modelService.modelService.getModelImplementations.mockResolvedValueOnce(mockImplementations.filter(imp => imp.modelId === '1'));

    await renderWithRouter('/models');
    
    // Wait for models to load
    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });
    
    // Click the manage implementations button for GPT-4o
    const manageButtons = screen.getAllByText('管理实现');
    fireEvent.click(manageButtons[0]);
    
    // Check if we navigate to implementations page
    await waitFor(() => {
      expect(screen.getByText('GPT-4o 的实现管理')).toBeInTheDocument();
      expect(modelService.modelService.getModelImplementations).toHaveBeenCalledWith('1');
    });
  });

  it('adds a model implementation', async () => {
    // Mock implementations for model 1
    modelService.modelService.getModelImplementations.mockResolvedValueOnce(
      mockImplementations.filter(imp => imp.modelId === '1')
    );
    
    // Mock successful implementation creation
    modelService.modelService.createModelImplementation.mockResolvedValueOnce({
      id: '3',
      providerId: '2',
      modelId: '1',
      providerModelId: 'gpt-4o-mini',
      version: '2023-05',
      contextWindow: 128000,
      isAvailable: true,
    });

    await renderWithRouter('/models');
    
    // Wait for models to load and navigate to implementations
    await waitFor(() => {
      expect(screen.getByText('GPT-4o')).toBeInTheDocument();
    });
    
    const manageButtons = screen.getAllByText('管理实现');
    fireEvent.click(manageButtons[0]);
    
    // Wait for implementations to load
    await waitFor(() => {
      expect(screen.getByText('GPT-4o 的实现管理')).toBeInTheDocument();
    });
    
    // Click add implementation button
    fireEvent.click(screen.getByText('添加实现'));
    
    // Fill the form
    const providerSelect = screen.getByPlaceholderText('选择提供商');
    fireEvent.mouseDown(providerSelect);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Anthropic'));
    });
    
    fireEvent.change(screen.getByPlaceholderText('例如: gpt-4o, claude-3-opus-20240229'), {
      target: { value: 'gpt-4o-mini' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('例如: 2023-05'), {
      target: { value: '2023-05' },
    });
    
    fireEvent.change(screen.getByPlaceholderText('例如: 128000'), {
      target: { value: '128000' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    
    // Check if API was called with correct data
    await waitFor(() => {
      expect(modelService.modelService.createModelImplementation).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: '2',
          modelId: '1',
          providerModelId: 'gpt-4o-mini',
          version: '2023-05',
          contextWindow: '128000', // Note: form values from inputs are strings
        })
      );
    });
  });
});