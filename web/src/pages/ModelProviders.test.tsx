import { describe, it, expect, beforeEach } from 'vitest'
import { screen, waitFor,fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../test/test-utils'

describe('ModelProviders Page', () => {
  beforeEach(async () => {
    await renderWithRouter('/models')
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
    const initialKeyCount = screen.getAllByRole('listitem').length
    
    // Open add key modal
    await userEvent.click(screen.getByRole('button', { name: /添加密钥/ }))
    
    // Fill form but then cancel
    await userEvent.type(screen.getByRole('textbox', { name: '别名' }), '取消测试密钥')
    await userEvent.type(screen.getByLabelText('API密钥'), 'sk-cancel-test-key')
    
    // Click cancel button
    const cancelButton = screen.getByRole('button', { name: /Cancel/i })
    await userEvent.click(cancelButton)
    
    // Verify key was not added
    const newKeyCount = screen.getAllByRole('listitem').length
    expect(newKeyCount).toBe(initialKeyCount)
    expect(screen.queryByText('取消测试密钥')).not.toBeInTheDocument()
  })

  it('should cancel editing an API key', async () => {
    // Navigate to key management screen
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // Find original key name to edit
    const firstKeyText = screen.getAllByRole('listitem')[0].textContent
    
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
      const updatedKeyText = screen.getAllByRole('listitem')[0].textContent
      expect(updatedKeyText).toBe(firstKeyText)
      expect(screen.queryByText('不保存的修改')).not.toBeInTheDocument()
    })
  })

  it('should delete API key after confirmation', async () => {
    await renderWithRouter('/models')
    // Navigate to key management screen
    const manageKeyButtons = screen.getAllByRole('button', { name: /管理密钥/ })
    await userEvent.click(manageKeyButtons[0])
    
    // Get initial key count
    const initialKeyCount = screen.getAllByRole('listitem').length

    // Get name of key to be deleted for verification
    const keyToDeleteText = screen.getAllByRole('listitem')[0].textContent
    
    // Delete first key
    const deleteButtons = screen.getAllByRole('button', { name: /删除/ })
    await userEvent.click(deleteButtons[0])
    
    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: '是' })
    await userEvent.click(confirmButton)
    
    // Verify key was deleted
    await waitFor(() => {
      const newKeyCount = screen.getAllByRole('listitem').length
      expect(newKeyCount).toBe(initialKeyCount - 3) // each key has 3 list items
      
      // Verify the specific key no longer exists
      const remainingKeysText = screen.getAllByRole('listitem').map(item => item.textContent)
      expect(remainingKeysText).not.toContain(keyToDeleteText)
    })
  })

})