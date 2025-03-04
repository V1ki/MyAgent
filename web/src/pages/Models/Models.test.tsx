import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/test-utils'
import { modelService as originalModelService, providerService as originalProviderService, FrontendModel, FrontendModelImplementation, ModelProvider } from '../../services/api'
import { resetMocks } from '../../test/mocks/api-mocks'
import {act} from 'react';

// 定义初始mock数据
const initialMockModels: FrontendModel[] = [
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
]

const initialMockProviders: ModelProvider[] = [
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
]

const initialMockImplementations: FrontendModelImplementation[] = [
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
]

// 明确定义mock类型
type MockModelService = {
  [K in keyof typeof originalModelService]: ReturnType<typeof vi.fn>
}

type MockProviderService = {
  [K in keyof typeof originalProviderService]: ReturnType<typeof vi.fn>
}

// Mock API 模块
vi.mock('../../services/api', () => {
  const mockModelService = {
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

  const mockProviderService = {
    getProviders: vi.fn(),
  }

  return {
    modelService: mockModelService,
    providerService: mockProviderService,
  }
})

let mockModels: FrontendModel[]
let mockImplementations: FrontendModelImplementation[]
let mockModelService: MockModelService
let mockProviderService: MockProviderService

describe('Models Component', () => {
  beforeEach(async () => {
    // 重置mock数据以确保测试隔离
    resetMocks()
    
    // 在每个测试前重置mock数据
    mockModels = JSON.parse(JSON.stringify(initialMockModels))
    mockImplementations = JSON.parse(JSON.stringify(initialMockImplementations))
    
    // 获取mock对象的引用
    const api = await import('../../services/api')
    mockModelService = api.modelService as unknown as MockModelService
    mockProviderService = api.providerService as unknown as MockProviderService
    
    // 设置所有mock实现
    mockModelService.getModels.mockImplementation(() => Promise.resolve([...mockModels]))
    mockProviderService.getProviders.mockImplementation(() => Promise.resolve([...initialMockProviders]))
    
    mockModelService.getModel.mockImplementation((id: string) => {
      const model = mockModels.find(m => m.id === id)
      if (!model) {
        return Promise.reject(new Error(`Model with ID ${id} not found`))
      }
      return Promise.resolve({...model})
    })
    
    mockModelService.createModel.mockImplementation((model: Omit<FrontendModel, 'id'>) => {
      const newModel: FrontendModel = {
        id: `model-${Date.now()}`,
        name: model.name || '',
        description: model.description || '',
        capabilities: model.capabilities || [],
        family: model.family || '',
      }
      mockModels.push(newModel)
      return Promise.resolve({...newModel})
    })
    
    mockModelService.updateModel.mockImplementation((id: string, model: Partial<FrontendModel>) => {
      const index = mockModels.findIndex(m => m.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Model with ID ${id} not found`))
      }
      
      mockModels[index] = {
        ...mockModels[index],
        ...model,
      }
      return Promise.resolve({...mockModels[index]})
    })
    
    mockModelService.deleteModel.mockImplementation((id: string) => {
      const index = mockModels.findIndex(m => m.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Model with ID ${id} not found`))
      }
      mockModels.splice(index, 1)
      return Promise.resolve()
    })
    
    mockModelService.getModelImplementations.mockImplementation((modelId: string) => {
      const implementations = mockImplementations.filter(imp => imp.modelId === modelId)
      return Promise.resolve([...implementations])
    })
    
    mockModelService.createModelImplementation.mockImplementation((modelId: string, implementation: Omit<FrontendModelImplementation, 'id' | 'modelId'>) => {
      const newImpl: FrontendModelImplementation = {
        id: `impl-${Date.now()}`,
        modelId,
        ...implementation,
      }
      mockImplementations.push(newImpl)
      return Promise.resolve({...newImpl})
    })
    
    mockModelService.updateModelImplementation.mockImplementation((id: string, implementation: Partial<FrontendModelImplementation>) => {
      const index = mockImplementations.findIndex(imp => imp.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Implementation with ID ${id} not found`))
      }
      
      mockImplementations[index] = {
        ...mockImplementations[index],
        ...implementation,
      }
      return Promise.resolve({...mockImplementations[index]})
    })
    
    mockModelService.deleteModelImplementation.mockImplementation((id: string) => {
      const index = mockImplementations.findIndex(imp => imp.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Implementation with ID ${id} not found`))
      }
      mockImplementations.splice(index, 1)
      return Promise.resolve()
    })

    vi.clearAllMocks()
    
    await renderWithRouter('/models')
    await waitFor(() => expect(mockModelService.getModels).toHaveBeenCalled())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render models page with initial data', async () => {
    // Use more specific selector - look for the page title heading
    expect(screen.getByRole('heading', { name: '模型管理' })).toBeInTheDocument()
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
    expect(screen.getByText('Claude 3 Opus')).toBeInTheDocument()
    expect(screen.getAllByText('text-generation')).toHaveLength(2)
    expect(screen.getAllByText('function-calling')).toHaveLength(2)
    expect(screen.getByText('vision')).toBeInTheDocument()
  })

  it('should show modal title when adding a model', async () => {
    const addButton = screen.getByRole('button', { name: /添加模型/ })
    await userEvent.click(addButton)
    
    expect(screen.getByRole('dialog')).toHaveTextContent('添加模型')
    expect(screen.getByLabelText('名称')).toBeInTheDocument()
    expect(screen.getByLabelText('描述')).toBeInTheDocument()
  })

  it('should add new model successfully', async () => {
    await userEvent.click(screen.getByRole('button', { name: /添加模型/ }))
    
    await userEvent.type(screen.getByLabelText('名称'), 'Test Model')
    await userEvent.type(screen.getByLabelText('描述'), 'Test model description')
    
    // Update the capabilities selection interaction using the role
    const capabilitiesSelect = screen.getByRole('combobox', { name: '能力' })
    await userEvent.click(capabilitiesSelect)
    const textGenOption = screen.getByText('文本生成')
    await userEvent.click(textGenOption)
    
    await userEvent.type(screen.getByLabelText('模型系列'), 'Test')
    
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    await waitFor(() => {
      expect(mockModelService.createModel).toHaveBeenCalledWith({
        name: 'Test Model',
        description: 'Test model description',
        capabilities: ['text-generation'],
        family: 'Test',
      })
    })
    
    // 验证是否调用getModels刷新列表
    await waitFor(() => {
      expect(mockModelService.getModels).toHaveBeenCalledTimes(2)
    })
    
    // 验证新模型是否显示在列表中
    await waitFor(() => {
      expect(screen.getByText('Test Model')).toBeInTheDocument()
    })
  })

  it('should cancel adding new model', async () => {
    const initialModelCount = screen.getAllByRole('row').length - 1 // Subtract header row
    
    await userEvent.click(screen.getByRole('button', { name: /添加模型/ }))
    await userEvent.type(screen.getByLabelText('名称'), 'Test Cancel Model')
    await userEvent.type(screen.getByLabelText('描述'), 'Test cancel description')
    
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    
    const newModelCount = screen.getAllByRole('row').length - 1
    expect(newModelCount).toBe(initialModelCount)
    expect(screen.queryByText('Test Cancel Model')).not.toBeInTheDocument()
    expect(mockModelService.createModel).not.toHaveBeenCalled()
  })

  it('should edit existing model', async () => {
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    const nameInput = screen.getByLabelText('名称')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'GPT-4o Modified')
    
    const descInput = screen.getByLabelText('描述')
    await userEvent.clear(descInput)
    await userEvent.type(descInput, 'Modified description')
    
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    await waitFor(() => {
      expect(mockModelService.updateModel).toHaveBeenCalledWith('1', {
        name: 'GPT-4o Modified',
        description: 'Modified description',
        capabilities: ['text-generation', 'function-calling', 'vision'],
        family: 'GPT-4'
      })
    })
    
    // 验证是否调用getModels刷新列表
    await waitFor(() => {
      expect(mockModelService.getModels).toHaveBeenCalledTimes(2)
    })
    
    // 使用更具体的选择器验证更新后的数据
    await waitFor(() => {
      // Find the row containing the updated model name
      const modelRow = screen.getByRole('row', { name: /GPT-4o Modified/ })
      expect(modelRow).toBeInTheDocument()
      // Verify the description within that row
      expect(modelRow).toHaveTextContent('Modified description')
    })
  })

  it('should delete model after confirmation', async () => {
    const initialModelCount = screen.getAllByRole('row').length - 1

    expect(initialModelCount).toBe(2)
    
    const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
    await userEvent.click(deleteButtons[0])

    const confirmButton = screen.getByRole('button', { name: '是' })
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockModelService.deleteModel).toHaveBeenCalledWith('1')
    })
    
    // 验证是否调用getModels刷新列表
    await waitFor(() => {
      expect(mockModelService.getModels).toHaveBeenCalledTimes(2)
    })
    
    await waitFor(() => {
      const newModelCount = screen.getAllByRole('row').length - 1
      expect(newModelCount).toBe(initialModelCount - 1)
      expect(screen.queryByText('GPT-4o')).not.toBeInTheDocument()
    })
  })

  it('should manage model implementations', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /管理实现/ })
    await act(async () => {
      await userEvent.click(implementationButtons[0])
    })
    await waitFor(() => {
      expect(mockModelService.getModelImplementations).toHaveBeenCalledWith('1')
    })
    
    expect(screen.getByText(/的实现管理/)).toBeInTheDocument()
    expect(screen.getByText('gpt-4o')).toBeInTheDocument()

    // Add new implementation
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: /添加实现/ }))
    })

    // 等待模态框出现
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Select provider - handle Antd Select component
    const providerSelect = screen.getByLabelText('提供商')
    await act(async () => {
      await userEvent.click(providerSelect)
    })

    // Wait for dropdown to appear and select option
    await waitFor(() => {
      const options = screen.getAllByText('OpenAI')
      const option = options.find(opt => opt.closest('.ant-select-item'))
      expect(option).toBeInTheDocument()
      userEvent.click(option!)
    })
    
    // Fill in other fields
    await act(async () => {
      await userEvent.type(screen.getByLabelText('提供商模型ID'), 'gpt-4o-test')
      await userEvent.type(screen.getByLabelText('版本'), 'test-version')
      await userEvent.type(screen.getByLabelText('上下文窗口大小'), '32000')
      await userEvent.type(screen.getByLabelText('输入价格'), '0.02')
      await userEvent.type(screen.getByLabelText('输出价格'), '0.04')
    })

    // Submit form
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    })

    // Verify the API call
    await waitFor(() => {
      expect(mockModelService.createModelImplementation).toHaveBeenCalledWith('1', {
        providerId: '1', // OpenAI 的 ID
        modelId: '1',
        providerModelId: 'gpt-4o-test',
        version: 'test-version',
        contextWindow: "32000",
        pricingInfo: {
          currency: 'USD',
          billingMode: 'token',
          inputPrice: "0.02",
          outputPrice: "0.04",
          notes: undefined,
        },
        isAvailable: true,
        customParameters: undefined,
      })
    })
  })

  it('should handle API error during model update', async () => {
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    mockModelService.updateModel.mockRejectedValueOnce(new Error('Update Failed'))
    
    await userEvent.clear(screen.getByLabelText('名称'))
    await userEvent.type(screen.getByLabelText('名称'), 'GPT-4o Error Test')
    
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))

    await waitFor(() => {
      expect(screen.getByText(/保存失败/)).toBeInTheDocument()
    })
    
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
    expect(screen.queryByText('GPT-4o Error Test')).not.toBeInTheDocument()
  })

  it('should validate required fields when adding model', async () => {
    await userEvent.click(screen.getByRole('button', { name: /添加模型/ }))
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    await waitFor(() => {
      expect(screen.getByText('请输入模型名称')).toBeInTheDocument()
      expect(screen.getByText('请选择模型能力')).toBeInTheDocument()
      expect(screen.getByText('请输入模型系列')).toBeInTheDocument()
    })
    
    expect(mockModelService.createModel).not.toHaveBeenCalled()
  })

  it('should handle API error during model fetch', async () => {
    mockModelService.getModels.mockRejectedValueOnce(new Error('API Error'))
    
    await renderWithRouter('/models')
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load models/)).toBeInTheDocument()
    })
    
    mockModelService.getModels.mockResolvedValueOnce([{
      id: '100',
      name: 'Test Model',
      description: 'Test Description',
      capabilities: ['text-generation'],
      family: 'Test'
    }])
    
    await userEvent.click(screen.getByRole('button', { name: /重试/ }))
    
    expect(mockModelService.getModels).toHaveBeenCalledTimes(3)
    
    await waitFor(() => {
      expect(screen.getByText('Test Model')).toBeInTheDocument()
    })
  })

  it('should validate required fields when adding implementation', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    
    await userEvent.click(screen.getByRole('button', { name: /添加实现/ }))
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    await waitFor(() => {
      expect(screen.getByText('请选择提供商')).toBeInTheDocument()
      expect(screen.getByText('请输入提供商模型ID')).toBeInTheDocument()
      expect(screen.getByText('请输入版本')).toBeInTheDocument()
    })
    
    expect(mockModelService.createModelImplementation).not.toHaveBeenCalled()
  })

  it('should cancel adding new implementation', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    
    const initialImplCount = screen.getAllByRole('row').length - 1
    
    await userEvent.click(screen.getByRole('button', { name: /添加实现/ }))
    await userEvent.type(screen.getByLabelText('提供商模型ID'), 'test-impl')
    
    await userEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    
    const newImplCount = screen.getAllByRole('row').length - 1
    expect(newImplCount).toBe(initialImplCount)
    expect(screen.queryByText('test-impl')).not.toBeInTheDocument()
  })

  it('should edit model implementation', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    await userEvent.clear(screen.getByLabelText('版本'))
    await userEvent.type(screen.getByLabelText('版本'), '2024-03')
    
    await userEvent.clear(screen.getByLabelText('上下文窗口大小'))
    await userEvent.type(screen.getByLabelText('上下文窗口大小'), '150000')
    
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    await waitFor(() => {
      expect(mockModelService.updateModelImplementation).toHaveBeenCalledWith('1', {
        version: '2024-03',
        contextWindow: "150000",
        providerId: expect.any(String),
        providerModelId: expect.any(String),
        pricingInfo: {
          currency: 'USD',
          billingMode: 'token',
          inputPrice: 0.01,
          outputPrice: 0.03,
          notes: undefined,
        },
        isAvailable: true,
      })
    })
  })

  it('should delete model implementation', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    const initialImplCount = screen.getAllByRole('row').filter(row => row.hasAttribute('data-row-key')).length
    
    const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
    await userEvent.click(deleteButtons[0])
    
    const confirmButton = screen.getByRole('button', { name: '是' })
    await userEvent.click(confirmButton)
    
    await waitFor(() => {
      expect(mockModelService.deleteModelImplementation).toHaveBeenCalledWith('1')
    })
    await waitFor(() => {
      // FIXME: 获取 非 placeholder 以及 header 的行数
      const newImplCount = screen.getAllByRole('row').filter(row => row.hasAttribute('data-row-key')).length
      expect(newImplCount).toBe(initialImplCount - 1) // echo row has self and operation row
      expect(screen.queryByText('gpt-4o')).not.toBeInTheDocument()
    })
  })

  it('should be able to return to models list', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    
    await userEvent.click(screen.getByRole('button', { name: /返 回/ }))
    
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '模型管理' })).toBeInTheDocument()
      expect(screen.queryByText(/的实现管理/)).not.toBeInTheDocument()
    })
  })

  it('should handle API error during implementation update', async () => {
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    mockModelService.updateModelImplementation.mockRejectedValueOnce(new Error('Update Failed'))
    
    await userEvent.clear(screen.getByLabelText('版本'))
    await userEvent.type(screen.getByLabelText('版本'), '2024-03-error')
    
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    await waitFor(() => {
      expect(screen.getByText(/保存失败/)).toBeInTheDocument()
    })
    
    expect(screen.getByText('2023-05')).toBeInTheDocument()
    expect(screen.queryByText('2024-03-error')).not.toBeInTheDocument()
  })

  it('should handle API error during implementation fetch', async () => {
    mockModelService.getModelImplementations.mockRejectedValueOnce(new Error('API Error'))
    
    const implementationButtons = screen.getAllByRole('button', { name: /实现/ })
    await userEvent.click(implementationButtons[0])
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load model implementations/)).toBeInTheDocument()
    })
    
    mockModelService.getModelImplementations.mockResolvedValueOnce([{
      id: '100',
      providerId: '1',
      modelId: '1',
      providerModelId: 'test-model',
      version: 'test',
      contextWindow: 32000,
      pricingInfo: {
        currency: 'USD',
        billingMode: 'token',
        inputPrice: 0.01,
        outputPrice: 0.02,
      },
      isAvailable: true,
    }])
    
    await userEvent.click(screen.getByRole('button', { name: /重试/ }))
    
    await waitFor(() => {
      expect(screen.getByText('test-model')).toBeInTheDocument()
    })
  })
})