import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithRouter } from '../../test/test-utils'
import userEvent from '@testing-library/user-event'

// Mock useNavigate
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

describe('Models Page', () => {
  it('should render models page with correct title', async () => {
    await renderWithRouter('/models')
    
    // 验证页面标题存在
    expect(screen.getByTestId('page-title')).toHaveTextContent('模型管理')
  })

  it('should display models in a table', async () => {
    await renderWithRouter('/models')
    
    // 验证表格中有示例模型
    expect(screen.getByText('GPT-4o')).toBeInTheDocument()
    expect(screen.getByText('Claude-3 Opus')).toBeInTheDocument()
    expect(screen.getByText('Gemini-1.5-Pro')).toBeInTheDocument()
  })

  it('should open add model modal when clicking add button', async () => {
    await renderWithRouter('/models')
    
    // 点击添加模型按钮
    const addButton = screen.getByText('添加模型')
    fireEvent.click(addButton)
    
    // 验证弹窗打开
    expect(screen.getByText('添加模型', { selector: '.ant-modal-title' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('例如: GPT-4o')).toBeInTheDocument()
  })

  it('should show model implementation view when clicking manage implementations button', async () => {
    await renderWithRouter('/models')
    
    // 点击管理实现按钮
    const manageButton = screen.getAllByText('管理实现')[0]
    fireEvent.click(manageButton)
    
    // 验证视图切换
    expect(screen.getByText('定价信息')).toBeInTheDocument()
    expect(screen.getByText('返 回')).toBeInTheDocument()
  })
})