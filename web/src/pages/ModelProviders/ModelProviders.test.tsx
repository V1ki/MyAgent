import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/test-utils'
import { providerService as originalProviderService, apiKeyService as originalApiKeyService } from '../../services/api'
import { convertToCamelCase } from '../../services/utils'
import { resetMocks } from '../../test/mocks/api-mocks'
import {act} from 'react';
import { ApiKey, ModelProvider } from '../../types/api'
import { a } from 'framer-motion/dist/types.d-6pKw1mTI'

// Mock the hooks used in the components
vi.mock('./hooks/useProviders', async () => {
  const actual = await vi.importActual('./hooks/useProviders');
  return actual;
});

vi.mock('./hooks/useApiKeys', async () => {
  const actual = await vi.importActual('./hooks/useApiKeys');
  return actual;
});

// Define the initial mock data outside the mock function
const initialMockProviders = [
  { 
    id: '1', 
    name: 'OpenAI', 
    base_url: 'https://api.openai.com',
    description: 'OpenAI GPT-series models API provider',
    api_keys_count: 2,
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
    api_keys_count: 1,
    api_keys: [
      { id: '201', provider_id: '2', alias: '默认', key_preview: 'sk-***********' }
    ]
  },
]

const initialApiKeys = {
  '1': [
    { id: '101', provider_id: '1', alias: '默认', key_preview: 'sk-***********' },
    { id: '102', provider_id: '1', alias: '高级账户', key_preview: 'sk-***********' }
  ],
  '2': [
    { id: '201', provider_id: '2', alias: '默认', key_preview: 'sk-***********' }
  ]
}

// Mock the API module
vi.mock('../../services/api', () => {
  // 创建 mock 模块
  return {
    providerService: {
      getAll: vi.fn(),
      getOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      createProvider: vi.fn(),
    },
    apiKeyService: {
      getAll: vi.fn(),
      getOne: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
  }
})
type MockProviderService = {
  [K in keyof typeof originalProviderService]: ReturnType<typeof vi.fn>
}
type MockApiKeyService = {
  [K in keyof typeof originalApiKeyService]: ReturnType<typeof vi.fn>
}
type MockProviderApiKeyService = {
  [K in keyof typeof originalApiKeyService]: ReturnType<typeof vi.fn>
}

// 从mock中获取引用，使用明确的类型声明
let mockProviders: ModelProvider[]
let mockApiKeys: Record<string, ApiKey[]>
let mockProviderService: MockProviderService
let mockApiKeyService: MockApiKeyService

describe('ModelProviders Page', () => {
  beforeEach(async () => {
    // Reset mock data before each test to ensure test isolation
    resetMocks()
    
    // Reset the mockProviders and mockApiKeys to a fresh copy before each test
    mockProviders = JSON.parse(JSON.stringify(initialMockProviders))
    mockApiKeys = JSON.parse(JSON.stringify(initialApiKeys))
    
    // 在测试开始前获取 mock 对象的引用
    const api = await import('../../services/api')
    mockProviderService = api.providerService as unknown as MockProviderService
    mockApiKeyService = api.apiKeyService as unknown as MockApiKeyService
    
    // Set up all mock implementations with the fresh mockProviders copy
    mockProviderService.getAll.mockImplementation(() => {
      const result = mockProviders.map(provider => convertToCamelCase(provider))
      return Promise.resolve(result)
    })
    
    mockProviderService.getOne.mockImplementation((id) => {
      const provider = mockProviders.find(p => p.id === id)
      if (!provider) {
        return Promise.reject(new Error(`Provider with ID ${id} not found`))
      }
      // Convert to camel case
      return Promise.resolve(convertToCamelCase(provider))
    })
    
    mockProviderService.createProvider.mockImplementation((provider, initialKey) => {
      const newProvider: ModelProvider = {
        id: `provider-${Date.now()}`,
        name: provider.name || '',
        base_url: provider.base_url || '',
        description: provider.description,
        api_keys: []
      }
      
      if (initialKey) {
        const newKey = {
          id: `key-${Date.now()}`,
          provider_id: newProvider.id,
          alias: initialKey.alias,
          key_preview: 'sk-***********'
        }
        newProvider.api_keys = [newKey]
        mockApiKeys[newProvider.id] = [newKey]
      }
      
      mockProviders.push(newProvider)
      return Promise.resolve({...newProvider})
    })
    
    mockProviderService.update.mockImplementation((id, provider) => {
      const index = mockProviders.findIndex(p => p.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Provider with ID ${id} not found`))
      }
      
      mockProviders[index] = {
        ...mockProviders[index],
        name: provider.name || mockProviders[index].name,
        base_url: provider.base_url || mockProviders[index].base_url,
        description: provider.description !== undefined ? provider.description : mockProviders[index].description
      }
      
      return Promise.resolve({...mockProviders[index]})
    })
    
    mockProviderService.delete.mockImplementation((id) => {
      const index = mockProviders.findIndex(p => p.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Provider with ID ${id} not found`))
      }
      
      // Remove provider's API keys
      delete mockApiKeys[id]
      
      mockProviders.splice(index, 1)
      return Promise.resolve()
    })

    // API key service mock implementations
    mockApiKeyService.getAll.mockImplementation((providerId) => {
      const keys = mockApiKeys[providerId]
      if (!keys) {
        return Promise.reject(new Error(`Provider with ID ${providerId} not found`))
      }
      return Promise.resolve([...keys])
    })
    
    mockApiKeyService.create.mockImplementation((apiKey, providerId) => {
      if (!mockApiKeys[providerId]) {
        mockApiKeys[providerId] = []
      }
      const newKey = {
        id: `key-${Date.now()}`,
        provider_id: providerId,
        alias: apiKey.alias || '',
        key_preview: 'sk-***********'
      }
      
      mockApiKeys[providerId].push(newKey)
      
      // Also update the provider's api_keys
      const provider = mockProviders.find(p => p.id === providerId)
      if (provider) {
        if (!provider.api_keys) provider.api_keys = []
        provider.api_keys.push(newKey)
      }
      
      return Promise.resolve({...newKey})
    })
    
    mockApiKeyService.update.mockImplementation((keyId, apiKey) => {
      // Find the key in all providers
      for (const [providerId, keys] of Object.entries(mockApiKeys)) {
        const keyIndex = keys.findIndex(k => k.id === keyId)
        if (keyIndex !== -1) {
          const updatedKey = {
            ...keys[keyIndex],
            alias: apiKey.alias || keys[keyIndex].alias,
          }
          mockApiKeys[providerId][keyIndex] = updatedKey
          
          // Also update the provider's api_keys
          const provider = mockProviders.find(p => p.id === providerId)
          if (provider && provider.api_keys) {
            const providerKeyIndex = provider.api_keys.findIndex(k => k.id === keyId)
            if (providerKeyIndex !== -1) {
              provider.api_keys[providerKeyIndex] = updatedKey
            }
          }
          
          return Promise.resolve({...updatedKey})
        }
      }
      
      return Promise.reject(new Error(`API key with ID ${keyId} not found`))
    })
    
    mockApiKeyService.delete.mockImplementation((keyId) => {
      // Find and delete the key from both mockApiKeys and provider's api_keys
      for (const [providerId, keys] of Object.entries(mockApiKeys)) {
        const keyIndex = keys.findIndex(k => k.id === keyId)
        if (keyIndex !== -1) {
          // Remove from mockApiKeys
          mockApiKeys[providerId].splice(keyIndex, 1)
          
          // Remove from provider's api_keys
          const provider = mockProviders.find(p => p.id === providerId)
          if (provider && provider.api_keys) {
            const providerKeyIndex = provider.api_keys.findIndex(k => k.id === keyId)
            if (providerKeyIndex !== -1) {
              provider.api_keys.splice(providerKeyIndex, 1)
            }
          }
          
          return Promise.resolve()
        }
      }
      
      return Promise.reject(new Error(`API key with ID ${keyId} not found`))
    })
    
    // 清除所有之前的 mock 调用记录
    vi.clearAllMocks()
    
    await renderWithRouter('/model-providers')
    // 等待初始数据加载
    await waitFor(() => expect(mockProviderService.getAll).toHaveBeenCalled())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Test cases for ProviderList component
  describe('ProviderList Component', () => {
    it('should render model providers page with initial data', async () => {
      // 验证页面标题
      expect(screen.getByText('模型提供商管理')).toBeInTheDocument()
      
      // 验证初始提供商数据
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
      expect(screen.getByText('Anthropic')).toBeInTheDocument()
      expect(screen.getByText('https://api.openai.com')).toBeInTheDocument()
      expect(screen.getByText('https://api.anthropic.com')).toBeInTheDocument()
    })

    it('should display correct API key counts', async () => {
      // Get the rows in the table
      const rows = screen.getAllByRole('row')
      
      // OpenAI should show 2 keys
      expect(rows[1]).toHaveTextContent('OpenAI')
      expect(rows[1]).toHaveTextContent('2') // API key count
      
      // Anthropic should show 1 key
      expect(rows[2]).toHaveTextContent('Anthropic')
      expect(rows[2]).toHaveTextContent('1') // API key count
    })

    it('should confirm before deleting provider', async () => {
      const initialProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
      
      // 点击第一个删除按钮
      const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
      await act(async () => {
        await userEvent.click(deleteButtons[0])
      });
      
      // Verify confirmation appears
      expect(screen.getByText('确定删除此提供商?')).toBeInTheDocument()
      expect(screen.getByText('删除提供商将同时删除所有相关的API密钥')).toBeInTheDocument()
      
      // Cancel the deletion
      const cancelButton = screen.getByRole('button', { name: '否' })
      
      await act(async () => {
        await userEvent.click(cancelButton)
      });
      
      // Verify provider was not deleted
      const currentProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
      expect(currentProviderCount).toBe(initialProviderCount)
      
      // Verify API was not called
      expect(mockProviderService.delete).not.toHaveBeenCalled()
    })
    
    it('should delete provider after confirmation', async () => {
      const initialProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
      
      // 点击第一个删除按钮
      const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
      await act(async () => {
        await userEvent.click(deleteButtons[0])
      });
      
      // 确认删除
      const confirmButton = screen.getByRole('button', { name: '是' })
      await act(async () => {
        await userEvent.click(confirmButton)
      });
      
      // Verify API was called correctly
      await waitFor(() => {
        expect(mockProviderService.delete).toHaveBeenCalledWith('1')
      })
      
      // 验证提供商是否被删除
      await waitFor(() => {
        const newProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
        expect(newProviderCount).toBe(initialProviderCount - 1)
      })
    })
  })

  // Test cases for ProviderForm component
  describe('ProviderForm Component', () => {
    it('should show modal title when adding a provider', async () => {
      const addButton = screen.getByRole('button', { name: /添加提供商/ })
      await act(async () => {
        await userEvent.click(addButton)
      })
      // Use a more specific selector - the modal title
      expect(screen.getByRole('dialog')).toHaveTextContent('添加提供商')
      expect(screen.getByRole('textbox', { name: '名称' })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: '接口地址' })).toBeInTheDocument()
    })

    it('should cancel adding new provider', async () => {
      const initialProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
      
      // Open modal
      const addButton = screen.getByRole('button', { name: /添加提供商/ })
      
      await act(async () => {
        await userEvent.click(addButton)
      })
      
      // Fill form
      await userEvent.type(screen.getByRole('textbox', { name: '名称' }), 'Test Provider')
      
      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      await act(async () => {
        await userEvent.click(cancelButton)
      })
      
      // Verify provider was not added
      const newProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
      expect(newProviderCount).toBe(initialProviderCount)
      expect(screen.queryByText('Test Provider')).not.toBeInTheDocument()
      
      // Verify API was not called
      expect(mockProviderService.createProvider).not.toHaveBeenCalled()
    })

    it('should add new provider with initial key', async () => {
      // 打开添加模态框
      const addButton = screen.getByRole('button', { name: /添加提供商/ })
      await act(async () => {
        await userEvent.click(addButton)
      })
      
      // 填写表单
      
      await act(async () => {
      await userEvent.type(screen.getByRole('textbox', { name: '名称' }), 'Claude')
      await userEvent.type(screen.getByRole('textbox', { name: '接口地址' }), 'https://api.claude.ai')
      await userEvent.type(screen.getByRole('textbox', { name: '初始密钥别名' }), '测试密钥')
      await userEvent.type(screen.getByLabelText('初始API密钥'), 'sk-test-key')
      })
      
      // 提交表单
      const submitButton = screen.getByRole('button', { name: 'OK' })
      await act(async () => {
        await userEvent.click(submitButton)
      })
      
      // Wait for the API to be called
      await waitFor(() => {
        expect(mockProviderService.createProvider).toHaveBeenCalledWith(
          {
            name: 'Claude',
            base_url: 'https://api.claude.ai',
            description: undefined
          },
          {
            alias: '测试密钥',
            key: 'sk-test-key'
          }
        )
      })
      
      // Verify that getProviders was called to refresh the list
      expect(mockProviderService.getAll).toHaveBeenCalledTimes(2)
      
      // 验证新提供商是否显示在列表中
      await waitFor(() => {
        expect(screen.getByText('Claude')).toBeInTheDocument()
        expect(screen.getByText('https://api.claude.ai')).toBeInTheDocument()
      })
    })

    it('should validate required fields when adding provider', async () => {
      const addButton = screen.getByRole('button', { name: /添加提供商/ })
      await act(async () => { 
        await userEvent.click(addButton)
      })
      
      // 直接点击确定，不填写表单
      const submitButton = screen.getByRole('button', { name: 'OK' })
      await act(async () => {
        await userEvent.click(submitButton)
      });
      await waitFor(() => {
        expect(screen.getByText('请输入提供商名称')).toBeInTheDocument()
        expect(screen.getByText('请输入接口地址')).toBeInTheDocument()
      })
      
      // Verify API was not called
      expect(mockProviderService.createProvider).not.toHaveBeenCalled()
    })

    it('should edit existing provider', async () => {
      // Store initial key count before editing
      const providerRow = screen.getAllByRole('row')[1]; // First provider row
      const initialKeyCount = providerRow.textContent?.match(/(\d+)/)?.[0]; // Extract key count
      
      // 点击第一个编辑按钮
      const editButtons = screen.getAllByRole('button', { name: /编辑/ })
      await act(async () => {
        await userEvent.click(editButtons[0])
      })
      
      // 修改名称
      const nameInput = screen.getByRole('textbox', { name: '名称' })
      await act(async () => {
        await userEvent.clear(nameInput)
        await userEvent.type(nameInput, 'OpenAI Modified')
      })
      
      // 提交修改
      const submitButton = screen.getByRole('button', { name: 'OK' })
      await act(async () => {
        await userEvent.click(submitButton)
      })
      
      // Verify API was called correctly
      await waitFor(() => {
        expect(mockProviderService.update).toHaveBeenCalledWith(
          '1',  // First provider ID
          {
            name: 'OpenAI Modified',
            baseUrl: 'https://api.openai.com',
            description: 'OpenAI GPT-series models API provider'
          },
        )
      })
      
      // Verify getProvider was called to refresh the data
      expect(mockProviderService.getOne).toHaveBeenCalledWith('1')
      
      // 验证修改是否生效
      await waitFor(() => {
        expect(screen.getByText('OpenAI Modified')).toBeInTheDocument()
        screen.logTestingPlaygroundURL()
        // Verify API key count remains the same after edit
        const updatedProviderRow = screen.getAllByRole('row')[1]; // First provider row after update
        const updatedKeyCount = updatedProviderRow.textContent?.match(/(\d+)/)?.[0]; // Extract key count
        expect(updatedKeyCount).toBe(initialKeyCount);
      })
    })
  })

  // Test cases for API Key management
  describe('ApiKey Management', () => {
    beforeEach(async () => {
      // Navigate to key management screen for each test in this describe block
      const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
      await act(async () => {
        await userEvent.click(manageKeyButtons[0])
      })
      
      // Wait for API keys to be displayed
      await waitFor(() => {
        expect(screen.getByText(/的 API 密钥管理/)).toBeInTheDocument()
      })
    })

    it('should display ProviderDetail correctly', async () => {
      // Verify provider details are displayed
      expect(screen.getByText(/OpenAI 的 API 密钥管理/)).toBeInTheDocument()
      expect(screen.getByText(/提供商名称:/)).toBeInTheDocument()
      expect(screen.getByText(/接口地址:/)).toBeInTheDocument()
      expect(screen.getByText(/描述:/)).toBeInTheDocument()
      expect(screen.getByText(/OpenAI GPT-series models API provider/)).toBeInTheDocument()
    })

    it('should display API keys in ApiKeyList', async () => {
      // Verify API key list is displayed
      expect(screen.getByText('API 密钥列表')).toBeInTheDocument()
      expect(screen.getByText('默认')).toBeInTheDocument()
      expect(screen.getByText('高级账户')).toBeInTheDocument()
      
      // Verify add key button is displayed
      expect(screen.getByRole('button', { name: /添加密钥/ })).toBeInTheDocument()
    })

    it('should add new API key', async () => {
      // 添加新密钥
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /添加密钥/ }))
      })
      
      await act(async () => {
        await userEvent.type(screen.getByLabelText('API密钥'), 'sk-new-test-key')
        await userEvent.type(screen.getByLabelText('别名'), '新测试密钥')
        await userEvent.click(screen.getByRole('button', { name: 'OK' }))
      })
      // Verify API was called correctly
      await waitFor(() => {
        expect(mockApiKeyService.create).toHaveBeenCalledWith(
          {
            alias: '新测试密钥',
            key: 'sk-new-test-key'
          },
          '1' // Provider ID
        )
      })
      
      // Verify provider was refreshed
      expect(mockProviderService.getOne).toHaveBeenCalledTimes(2)
      // 验证新密钥是否添加成功
      await waitFor(() => {
        expect(screen.getByText('新测试密钥')).toBeInTheDocument()
      })
    })

    it('should edit existing API key', async () => {
      // 编辑密钥
      const editButtons = screen.getAllByRole('button', { name: /编辑/ })
      await act(async () => {
        await userEvent.click(editButtons[0])
      })
      
      const aliasInput = screen.getByRole('textbox', { name: '别名' })

      await act(async () => {      
        await userEvent.clear(aliasInput)
        await userEvent.type(aliasInput, '已修改的密钥')
        await userEvent.click(screen.getByRole('button', { name: 'OK' }))
      })
      
      // Verify API was called correctly
      await waitFor(() => {
        expect(mockApiKeyService.update).toHaveBeenCalledWith(
          '101',  // First key ID
          {
            alias: '已修改的密钥',
            key: "" // No key provided when editing
          },
          '1' // Provider ID
        )
      })
      
      // 验证密钥修改是否成功
      await waitFor(() => {
        expect(screen.getByText('已修改的密钥')).toBeInTheDocument()
      })
    })

    it('should validate required fields when adding API key', async () => {
      const addButton = screen.getByRole('button', { name: /添加密钥/ })
      // 打开添加密钥模态框
      await act(async () => {
        await userEvent.click(addButton)
      })
      
      const okButton = screen.getByRole('button', { name: 'OK' })
      // 直接点击确定，不填写表单
      await act(async () => {
        await userEvent.click(okButton)
      })
      
      // 验证错误提示
      await waitFor(() => {
        expect(screen.getByText('请输入密钥别名')).toBeInTheDocument()
        expect(screen.getByText('请输入API密钥')).toBeInTheDocument()
      })
      
      // Verify API was not called
      expect(mockApiKeyService.create).not.toHaveBeenCalled()
    })

    it('should delete API key after confirmation', async () => {
      // Get initial key count
      const initialKeyCount = screen.getAllByRole('row').length - 1 // Subtract header row
      
      // Get name of key to be deleted for verification
      const keyToDeleteText = screen.getAllByRole('row')[1].textContent
      
      // Delete first key
      const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
      await act(async () => {
        await userEvent.click(deleteButtons[0])
      })
      
      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: '是' })
      await act(async () => {
        await userEvent.click(confirmButton)
      })
      
      // Verify API was called correctly
      await waitFor(() => {
        expect(mockApiKeyService.delete).toHaveBeenCalledWith('101', '1') // Key ID and Provider ID
      })
      
      // Verify provider was refreshed
      expect(mockProviderService.getOne).toHaveBeenCalledTimes(2)
      
      // Verify key was deleted
      await waitFor(() => {
        const newKeyCount = screen.getAllByRole('row').length - 1 // Subtract header row
        expect(newKeyCount).toBe(initialKeyCount - 1) 
      })
    })

    it('should be able to return to provider list', async () => {
      // 点击返回按钮
      await userEvent.click(screen.getByRole('button', { name: /返 回/ }))
      
      // 验证是否返回到提供商列表
      await waitFor(() => {
        expect(screen.getByText('模型提供商管理')).toBeInTheDocument()
        expect(screen.queryByText(/的 API 密钥管理/)).not.toBeInTheDocument()
      })
    })
  })

  // Tests for error handling
  describe('Error Handling', () => {
    it('should handle API error during provider fetch', async () => {
      // Force an error on next API call
      mockProviderService.getAll.mockRejectedValueOnce(new Error('API Error'))
      // Remount the component to trigger the API call
      await renderWithRouter('/model-providers')
      
      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText(/Failed to load model providers/)).toBeInTheDocument()
      })
      
      // Test retry functionality
      mockProviderService.getAll.mockResolvedValueOnce([{
        id: '100',
        name: 'Test Provider',
        baseUrl: 'https://test.api',
        description: 'Test Description'
      }])
      
      // Click retry button
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /重试/ }))
      })
      
      // Verify API was called again
      expect(mockProviderService.getAll).toHaveBeenCalledTimes(3)
      screen.logTestingPlaygroundURL()
      // Verify new data is displayed
      expect(screen.getByText('Test Provider')).toBeInTheDocument()
      expect(screen.getByText('https://test.api')).toBeInTheDocument()
    })

    it('should handle API error during provider update', async () => {
      // 点击第一个编辑按钮
      const editButtons = screen.getAllByRole('button', { name: /编辑/ })
      await userEvent.click(editButtons[0])
      
      // Force an error on next API call
      mockProviderService.update.mockRejectedValueOnce(new Error('Update Failed'))
      
      // 修改名称
      const nameInput = screen.getByRole('textbox', { name: '名称' })
      await userEvent.clear(nameInput)
      await userEvent.type(nameInput, 'OpenAI Modified Error')
      
      // 提交修改
      const submitButton = screen.getByRole('button', { name: 'OK' })
      await userEvent.click(submitButton)
      
      // Verify error message is shown (now using Ant Design message)
      await waitFor(() => {
        expect(mockProviderService.update).toHaveBeenCalled()
      })
      
      // Verify original data is unchanged
      expect(screen.getByText('OpenAI')).toBeInTheDocument()
      expect(screen.queryByText('OpenAI Modified Error')).not.toBeInTheDocument()
    })
  })
});