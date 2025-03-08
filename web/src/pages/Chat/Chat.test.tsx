import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/test-utils'
import { act } from 'react'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

describe('Chat Page', () => {
  beforeEach(async () => {
    // 渲染组件
    await renderWithRouter('/chat')
  });

  describe('Basic Interface', () => {
    it('renders chat interface with conversation list and input area', () => {
      // 验证会话列表区域，使用更具体的选择器
      const sidebarHeading = screen.getByRole('heading', { name: '会话列表' })
      expect(sidebarHeading).toBeInTheDocument()
      
      // 验证输入区域
      expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()
      
      // 使用更具体的选择器来定位发送按钮
      const sendButton = screen.getByRole('button', { 
        name: (_, element) => {
          const hasIcon = element.querySelector('.anticon-send') !== null;
          const hasText = element.textContent?.includes('发送') || false;
          return hasIcon && hasText;
        }
      })
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('Conversation Management', () => {
    it('creates new conversation', async () => {
      const newButton = screen.getByRole('button', { name: /新建会话/i })
      await userEvent.click(newButton)
      
      // 验证新会话创建后的展示
      expect(screen.getByText(/新会话/)).toBeInTheDocument()
    })
  })

  describe('Message Interactions', () => {
    it('handles message input and sending', async () => {
      const input = screen.getByPlaceholderText('输入消息...')
      const sendButton = screen.getByRole('button', { 
        name: (_, element) => {
          const hasIcon = element.querySelector('.anticon-send') !== null;
          const hasText = element.textContent?.includes('发送') || false;
          return hasIcon && hasText;
        }
      })
      
      // 输入并发送消息
      await userEvent.type(input, '测试消息')
      expect(input).toHaveValue('测试消息')
      
      await userEvent.click(sendButton)
      // 验证输入框被清空
      expect(input).toHaveValue('')
    })
  })

  describe('Model Selection and Settings', () => {
    it('opens model selector', async () => {
      const modelButton = screen.getByRole('button', { name: /个模型/ })
      await userEvent.click(modelButton)
      
      // 验证模型选择器打开
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/选择模型/)).toBeInTheDocument()
    })

    it('opens settings panel', async () => {
      // Use a more specific selector with both role and name
      const settingsButton = screen.getByRole('button', { name: '设置' })
      await act(async () => {
        await userEvent.click(settingsButton)
      })
      // 验证设置面板打开
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/生成参数设置/)).toBeInTheDocument()
      
      screen.logTestingPlaygroundURL()
      // 验证基本参数控件存在
      expect(screen.getByRole('spinbutton', { name: /Temperature/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /Top P/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /最大Token数/i })).toBeInTheDocument()


      expect(screen.getByRole('spinbutton', { name: /频率惩罚/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /存在惩罚/i })).toBeInTheDocument()


      expect(await screen.findAllByRole('spinbutton')).toHaveLength(5)
    })
  })
})