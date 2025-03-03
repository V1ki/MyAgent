import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/test-utils'
import { providerService as originalProviderService, apiKeyService as originalApiKeyService } from '../../services/api'
import { resetMocks } from '../../test/mocks/api-mocks'

// Define the initial mock data outside the mock function
const initialMockProviders = [
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
]

// Mock the API module
vi.mock('../../services/api', () => {
  // 创建 mock 模块
  return {
    providerService: {
      getProviders: vi.fn(),
      getProvider: vi.fn(),
      createProvider: vi.fn(),
      updateProvider: vi.fn(),
      deleteProvider: vi.fn(),
    },
    apiKeyService: {
      getApiKeys: vi.fn(),
      createApiKey: vi.fn(),
      updateApiKey: vi.fn(),
      deleteApiKey: vi.fn(),
    }
  }
})

// 从mock中获取引用，使用明确的类型声明
let mockProviders: typeof initialMockProviders
let mockProviderService: typeof originalProviderService
let mockApiKeyService: typeof originalApiKeyService

describe('ModelProviders Page', () => {
  beforeEach(async () => {
    // Reset mock data before each test to ensure test isolation
    resetMocks()
    
    // Reset the mockProviders to a fresh copy before each test
    mockProviders = JSON.parse(JSON.stringify(initialMockProviders))
    
    // 在测试开始前获取 mock 对象的引用
    const api = await import('../../services/api')
    mockProviderService = api.providerService
    mockApiKeyService = api.apiKeyService
    
    // Set up all mock implementations with the fresh mockProviders copy
    mockProviderService.getProviders.mockImplementation(() => Promise.resolve([...mockProviders]))
    
    mockProviderService.getProvider.mockImplementation((id) => {
      const provider = mockProviders.find(p => p.id === id)
      if (!provider) {
        return Promise.reject(new Error(`Provider with ID ${id} not found`))
      }
      return Promise.resolve({...provider})
    })
    
    mockProviderService.createProvider.mockImplementation((provider, initialKey) => {
      const newProvider = {
        id: `provider-${Date.now()}`,
        name: provider.name || '',
        base_url: provider.base_url || '',
        description: provider.description,
        api_keys: []
      }
      
      if (initialKey) {
        newProvider.api_keys = [{
          id: `key-${Date.now()}`,
          provider_id: newProvider.id,
          alias: initialKey.alias,
          key_preview: 'sk-***********'
        }]
      }
      
      mockProviders.push(newProvider)
      return Promise.resolve({...newProvider})
    })
    
    mockProviderService.updateProvider.mockImplementation((id, provider) => {
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
    
    mockProviderService.deleteProvider.mockImplementation((id) => {
      const index = mockProviders.findIndex(p => p.id === id)
      if (index === -1) {
        return Promise.reject(new Error(`Provider with ID ${id} not found`))
      }
      
      mockProviders.splice(index, 1)
      return Promise.resolve()
    })

    // API key service mock implementations
    mockApiKeyService.getApiKeys.mockImplementation((providerId) => {
      const provider = mockProviders.find(p => p.id === providerId)
      if (!provider) {
        return Promise.reject(new Error(`Provider with ID ${providerId} not found`))
      }
      return Promise.resolve([...(provider.api_keys || [])])
    })
    
    mockApiKeyService.createApiKey.mockImplementation((providerId, apiKey) => {
      const provider = mockProviders.find(p => p.id === providerId)
      if (!provider) {
        return Promise.reject(new Error(`Provider with ID ${providerId} not found`))
      }
      
      const newKey = {
        id: `key-${Date.now()}`,
        provider_id: providerId,
        alias: apiKey.alias || '',
        key_preview: 'sk-***********'
      }
      
      if (!provider.api_keys) {
        provider.api_keys = []
      }
      
      provider.api_keys.push(newKey)
      return Promise.resolve({...newKey})
    })
    
    mockApiKeyService.updateApiKey.mockImplementation((keyId, apiKey) => {
      for (const provider of mockProviders) {
        if (!provider.api_keys) continue
        
        const keyIndex = provider.api_keys.findIndex(k => k.id === keyId)
        if (keyIndex !== -1) {
          provider.api_keys[keyIndex] = {
            ...provider.api_keys[keyIndex],
            alias: apiKey.alias || provider.api_keys[keyIndex].alias,
          }
          return Promise.resolve({...provider.api_keys[keyIndex]})
        }
      }
      
      return Promise.reject(new Error(`API key with ID ${keyId} not found`))
    })
    
    mockApiKeyService.deleteApiKey.mockImplementation((keyId) => {
      for (const provider of mockProviders) {
        if (!provider.api_keys) continue
        
        const keyIndex = provider.api_keys.findIndex(k => k.id === keyId)
        if (keyIndex !== -1) {
          provider.api_keys.splice(keyIndex, 1)
          return Promise.resolve()
        }
      }
      
      return Promise.reject(new Error(`API key with ID ${keyId} not found`))
    })
    
    // 清除所有之前的 mock 调用记录
    vi.clearAllMocks()
    
    await renderWithRouter('/model-providers')
    // 等待初始数据加载
    await waitFor(() => expect(mockProviderService.getProviders).toHaveBeenCalled())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render model providers page with initial data', async () => {
    // 验证页面标题
    expect(screen.getByText('模型提供商管理')).toBeInTheDocument()
    
    // 验证初始提供商数据
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.getByText('Anthropic')).toBeInTheDocument()
    expect(screen.getByText('https://api.openai.com')).toBeInTheDocument()
    expect(screen.getByText('https://api.anthropic.com')).toBeInTheDocument()
  })

  it('should show modal title when adding a provider', async () => {
    const addButton = screen.getByRole('button', { name: /添加提供商/ })
    await userEvent.click(addButton)
    // Use a more specific selector - the modal title
    expect(screen.getByRole('dialog')).toHaveTextContent('添加提供商')
    expect(screen.getByRole('textbox', { name: '名称' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '接口地址' })).toBeInTheDocument()
  })

  it('should cancel adding new provider', async () => {
    const initialProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
    
    // Open modal
    const addButton = screen.getByRole('button', { name: /添加提供商/ })
    await userEvent.click(addButton)
    
    // Fill form
    await userEvent.type(screen.getByRole('textbox', { name: '名称' }), 'Test Provider')
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await userEvent.click(cancelButton)
    
    // Verify provider was not added
    const newProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
    expect(newProviderCount).toBe(initialProviderCount)
    expect(screen.queryByText('Test Provider')).not.toBeInTheDocument()
    
    // Verify API was not called
    expect(mockProviderService.createProvider).not.toHaveBeenCalled()
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

  it('should open add provider modal when clicking add button', async () => {
    const addButton = screen.getByRole('button', { name: /添加提供商/ })
    await userEvent.click(addButton)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toHaveTextContent('添加提供商')
    })
    expect(screen.getByRole('textbox', { name: '名称' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '接口地址' })).toBeInTheDocument()
  })

  it('should add new provider with initial key', async () => {
    // 打开添加模态框
    const addButton = screen.getByRole('button', { name: /添加提供商/ })
    await userEvent.click(addButton)
    
    // 填写表单
    await userEvent.type(screen.getByRole('textbox', { name: '名称' }), 'Claude')
    await userEvent.type(screen.getByRole('textbox', { name: '接口地址' }), 'https://api.claude.ai')
    await userEvent.type(screen.getByRole('textbox', { name: '初始密钥别名' }), '测试密钥')
    await userEvent.type(screen.getByLabelText('初始API密钥'), 'sk-test-key')
    
    // 提交表单
    const submitButton = screen.getByRole('button', { name: 'OK' })
    await userEvent.click(submitButton)
    
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
    expect(mockProviderService.getProviders).toHaveBeenCalledTimes(2)
    
    // 验证新提供商是否显示在列表中
    await waitFor(() => {
      expect(screen.getByText('Claude')).toBeInTheDocument()
      expect(screen.getByText('https://api.claude.ai')).toBeInTheDocument()
    })
  })

  it('should validate required fields when adding provider', async () => {
    const addButton = screen.getByRole('button', { name: /添加提供商/ })
    await userEvent.click(addButton)
    
    // 直接点击确定，不填写表单
    const submitButton = screen.getByRole('button', { name: 'OK' })
    await userEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('请输入提供商名称')).toBeInTheDocument()
      expect(screen.getByText('请输入接口地址')).toBeInTheDocument()
    })
    
    // Verify API was not called
    expect(mockProviderService.createProvider).not.toHaveBeenCalled()
  })

  it('should edit existing provider', async () => {
    // 点击第一个编辑按钮
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    // 修改名称
    const nameInput = screen.getByRole('textbox', { name: '名称' })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'OpenAI Modified')
    
    // 提交修改
    const submitButton = screen.getByRole('button', { name: 'OK' })
    await userEvent.click(submitButton)
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(mockProviderService.updateProvider).toHaveBeenCalledWith(
        '1',  // First provider ID
        {
          name: 'OpenAI Modified',
          base_url: 'https://api.openai.com',
          description: 'OpenAI GPT-series models API provider'
        }
      )
    })
    
    // Verify getProvider was called to refresh the data
    expect(mockProviderService.getProvider).toHaveBeenCalledWith('1')
    
    // 验证修改是否生效
    await waitFor(() => {
      expect(screen.getByText('OpenAI Modified')).toBeInTheDocument()
    })
  })

  it('should delete provider after confirmation', async () => {
    const initialProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
    
    // 点击第一个删除按钮
    const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
    await userEvent.click(deleteButtons[0])
    
    // 确认删除
    const confirmButton = screen.getByRole('button', { name: '是' })
    await userEvent.click(confirmButton)
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(mockProviderService.deleteProvider).toHaveBeenCalledWith('1')
    })
    
    // 验证提供商是否被删除
    await waitFor(() => {
      const newProviderCount = screen.getAllByRole('button', { name: /管理密钥/ }).length
      expect(newProviderCount).toBe(initialProviderCount - 1)
    })
  })

  it('should manage API keys', async () => {
    // 点击第一个管理密钥按钮
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(mockProviderService.getProvider).toHaveBeenCalledWith('1')
    })
    
    // 验证密钥管理界面
    await waitFor(() => {
      expect(screen.getByText(/的 API 密钥管理/)).toBeInTheDocument()
    })
    
    expect(screen.getByRole('button', { name: /添加密钥/ })).toBeInTheDocument()
    
    // 添加新密钥
    await userEvent.click(screen.getByRole('button', { name: /添加密钥/ }))
    await userEvent.type(screen.getByRole('textbox', { name: '别名' }), '新测试密钥')
    await userEvent.type(screen.getByLabelText('API密钥'), 'sk-new-test-key')
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(mockApiKeyService.createApiKey).toHaveBeenCalledWith(
        '1',
        {
          alias: '新测试密钥',
          key: 'sk-new-test-key'
        }
      )
    })
    
    // Verify provider was refreshed
    expect(mockProviderService.getProvider).toHaveBeenCalledTimes(2)
    
    // 验证新密钥是否添加成功
    await waitFor(() => {
      expect(screen.getByText('新测试密钥')).toBeInTheDocument()
    })
    
    // 编辑密钥
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    const aliasInput = screen.getByRole('textbox', { name: '别名' })
    await userEvent.clear(aliasInput)
    await userEvent.type(aliasInput, '已修改的密钥')
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(mockApiKeyService.updateApiKey).toHaveBeenCalledWith(
        '101',  // First key ID
        {
          alias: '已修改的密钥',
          key: undefined // No key provided when editing
        }
      )
    })
    
    // 验证密钥修改是否成功
    await waitFor(() => {
      expect(screen.getByText('已修改的密钥')).toBeInTheDocument()
    })
  })

  it('should validate required fields when adding API key', async () => {
    // 进入密钥管理界面
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // 打开添加密钥模态框
    await userEvent.click(screen.getByRole('button', { name: /添加密钥/ }))
    
    // 直接点击确定，不填写表单
    await userEvent.click(screen.getByRole('button', { name: 'OK' }))
    
    // 验证错误提示
    await waitFor(() => {
      expect(screen.getByText('请输入密钥别名')).toBeInTheDocument()
      expect(screen.getByText('请输入API密钥')).toBeInTheDocument()
    })
    
    // Verify API was not called
    expect(mockApiKeyService.createApiKey).not.toHaveBeenCalled()
  })

  it('should be able to return to provider list', async () => {
    // 进入密钥管理界面
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // 点击返回按钮
    await userEvent.click(screen.getByRole('button', { name: /返 回/ }))
    
    // 验证是否返回到提供商列表
    await waitFor(() => {
      expect(screen.getByText('模型提供商管理')).toBeInTheDocument()
      expect(screen.queryByText(/的 API 密钥管理/)).not.toBeInTheDocument()
    })
  })

  it('should cancel adding a new API key', async () => {
    // Navigate to key management screen
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // Get initial key count
    const initialKeyCount = screen.getAllByRole('row').length
    
    // Open add key modal
    await userEvent.click(screen.getByRole('button', { name: /添加密钥/ }))
    
    // Fill form but then cancel
    await userEvent.type(screen.getByRole('textbox', { name: '别名' }), '取消测试密钥')
    await userEvent.type(screen.getByLabelText('API密钥'), 'sk-cancel-test-key')
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await userEvent.click(cancelButton)
    
    // Verify key was not added
    const newKeyCount = screen.getAllByRole('row').length
    expect(newKeyCount).toBe(initialKeyCount)
    expect(screen.queryByText('取消测试密钥')).not.toBeInTheDocument()
  })

  it('should cancel editing an API key', async () => {
    // Navigate to key management screen
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // Find original key name to edit
    const firstKeyText = screen.getAllByRole('row')[0].textContent
    
    // Click edit on first key
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    // Change the alias
    const aliasInput = screen.getByRole('textbox', { name: '别名' })
    await userEvent.clear(aliasInput)
    await userEvent.type(aliasInput, '不保存的修改')
    
    // Cancel the edit
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await userEvent.click(cancelButton)
    
    // Verify the key name did not change
    await waitFor(() => {
      const updatedKeyText = screen.getAllByRole('row')[0].textContent
      expect(updatedKeyText).toBe(firstKeyText)
      expect(screen.queryByText('不保存的修改')).not.toBeInTheDocument()
    })
  })

  it('should delete API key after confirmation', async () => {
    // Navigate to key management screen
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // Get initial key count
    const initialKeyCount = screen.getAllByRole('row').length - 1 // Subtract header row
    
    // Get name of key to be deleted for verification
    const keyToDeleteText = screen.getAllByRole('row')[1].textContent
    
    // Delete first key
    const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
    await userEvent.click(deleteButtons[0])
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: '是' })
    await userEvent.click(confirmButton)
    
    // Verify API was called correctly
    await waitFor(() => {
      expect(mockApiKeyService.deleteApiKey).toHaveBeenCalledWith('101')
    })
    
    // Verify provider was refreshed
    expect(mockProviderService.getProvider).toHaveBeenCalledTimes(2)
    
    // Verify key was deleted
    await waitFor(() => {
      const newKeyCount = screen.getAllByRole('row').length - 1 // Subtract header row
      expect(newKeyCount).toBe(initialKeyCount - 1) 
    })
  })

  it('should handle API error during provider fetch', async () => {
    // Force an error on next API call
    mockProviderService.getProviders.mockRejectedValueOnce(new Error('API Error'))
    
    // Remount the component to trigger the API call
    await renderWithRouter('/model-providers')
    
    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(/Failed to load model providers/)).toBeInTheDocument()
    })
    
    // Test retry functionality
    mockProviderService.getProviders.mockResolvedValueOnce([{
      id: '100',
      name: 'Test Provider',
      base_url: 'https://test.api',
      description: 'Test Description'
    }])
    
    // Click retry button
    await userEvent.click(screen.getByRole('button', { name: /重试/ }))
    
    // Verify API was called again
    expect(mockProviderService.getProviders).toHaveBeenCalledTimes(3)
    
    // Verify new data is displayed
    await waitFor(() => {
      expect(screen.getByText('Test Provider')).toBeInTheDocument()
      expect(screen.getByText('https://test.api')).toBeInTheDocument()
    })
  })

  it('should handle API error during provider update', async () => {
    // 点击第一个编辑按钮
    const editButtons = screen.getAllByRole('button', { name: /编辑/ })
    await userEvent.click(editButtons[0])
    
    // Force an error on next API call
    mockProviderService.updateProvider.mockRejectedValueOnce(new Error('Update Failed'))
    
    // 修改名称
    const nameInput = screen.getByRole('textbox', { name: '名称' })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'OpenAI Modified Error')
    
    // 提交修改
    const submitButton = screen.getByRole('button', { name: 'OK' })
    await userEvent.click(submitButton)
    
    // Verify error message is shown
    await waitFor(() => {
      expect(screen.getByText(/保存失败/)).toBeInTheDocument()
    })
    
    // Verify original data is unchanged
    expect(screen.getByText('OpenAI')).toBeInTheDocument()
    expect(screen.queryByText('OpenAI Modified Error')).not.toBeInTheDocument()
  })
})