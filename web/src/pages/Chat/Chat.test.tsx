import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithRouter } from '../../test/test-utils'
import { act } from 'react'
import { modelService as originalModelService, conversationService as originalconversationService, chatService as originChatService } from '../../services/api'

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock conversation service
vi.mock('../../services/api', () => {
  const conversationService = {
    getConversations: vi.fn(),
    getConversation: vi.fn(),
    createConversation: vi.fn(),
    deleteConversation: vi.fn(),
    updateConversation: vi.fn(),
    getConversationTurns: vi.fn(),
    getConversationTurn: vi.fn(),
    createConversationTurn: vi.fn(),
    deleteConversationTurn: vi.fn(),
    getParameterPresets: vi.fn(),
    createParameterPreset: vi.fn(),
    deleteParameterPreset: vi.fn(),
  }
  const modelService = {
    getModels: vi.fn(),
    getModelImplementations: vi.fn()
  }
  const chatService = {
    sendMultiModelMessage: vi.fn(),
  }
  return {
    conversationService,
    modelService,
    chatService,
    // Mock other services if needed
  }
})

const mockInitialConversations = [
  {
    id: '1',
    title: '测试会话1',
    system_prompt: null,
    user_id: null,
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:30:00Z',
    turns: [
      {
        id: '1',
        user_input: '你好',
        content: '你好',
        createdAt: '2024-03-10T10:00:00Z',
        model_parameters: {
          "topP": 0.9,
          "maxTokens": 2048,
          "temperature": 0.7,
          "presencePenalty": 0,
          "frequencyPenalty": 0
        },
        "active_response_id": "1",
        is_deleted: false,
        responses: [
          {
            id: '1',
            content: '你好!我能帮你什么?',
            is_selected: true,
            createdAt: '2024-03-10T10:00:05Z',
            model_implementation_id: '1',
            model_implementation: {
              id: '1',
              provider_id: '1',
              model_id: '1',
              provider_model_id: 'gpt-4o',
              version: '2023-05',
              contextWindow: 128000,
              pricingInfo: {
                currency: 'USD',
                billingMode: 'token',
                inputPrice: 0.01,
                outputPrice: 0.03,
              },
              isAvailable: true,
            }
          }
        ]

      },
    ],
    messages: [
      {
        id: '1',
        role: 'user',
        content: '你好',
        createdAt: '2024-03-10T10:00:00Z',
      },
      {
        id: '2',
        role: 'assistant',
        content: '你好!我能帮你什么?',
        createdAt: '2024-03-10T10:00:05Z',
      }
    ]
  },
  {
    id: '2',
    title: '测试会话2',
    system_prompt: null,
    user_id: null,
    createdAt: '2024-03-10T11:00:00Z',
    updatedAt: '2024-03-10T11:30:00Z',
    turns: []
  }
]

const mockInitialConversationTurns = [

]

type MockConversationService = {
  [K in keyof typeof originalconversationService]: ReturnType<typeof vi.fn>
}
type MockModelService = {
  [K in keyof typeof originalModelService]: ReturnType<typeof vi.fn>
}

type MockChatService = {
  [K in keyof typeof originChatService]: ReturnType<typeof vi.fn>
}

let mockConversationService: MockConversationService
let mockModelService: MockModelService
let mockChatService: MockChatService

describe('Chat Page', () => {
  beforeEach(async () => {
    const api = await import('../../services/api')
    mockConversationService = api.conversationService as unknown as MockConversationService
    mockModelService = api.modelService as unknown as MockModelService
    mockChatService = api.chatService as unknown as MockChatService

    // Setup mock implementations
    const mockConversations = [...mockInitialConversations];

    mockConversationService.getConversations.mockResolvedValue(mockConversations)

    mockConversationService.getConversation.mockImplementation((id) => {
      const conversation = mockConversations.find(c => c.id === id);
      return Promise.resolve(conversation || null);
    });

    mockConversationService.createConversation.mockImplementation(({title}) => {
      const newConversation = {
        id: `conv-${Date.now()}`,
        title: title || '新会话',
        system_prompt: null,
        user_id: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        turns: []
      }
      mockConversations.push(newConversation);
      return Promise.resolve(newConversation)
    })

    mockConversationService.deleteConversation.mockImplementation((id) => {
      const index = mockConversations.findIndex(c => c.id === id);
      if (index !== -1) {
        mockConversations.splice(index, 1);
      }
      return Promise.resolve(true);
    });

    mockConversationService.updateConversation.mockImplementation((id, updates) => {
      const conversation = mockConversations.find(c => c.id === id);
      if (conversation) {
        Object.assign(conversation, updates, { updatedAt: new Date().toISOString() });
      }
      return Promise.resolve(conversation || null);
    });

    mockConversationService.getConversationTurns.mockImplementation((conversationId) => {
      const conversation = mockConversations.find(c => c.id === conversationId);
      return Promise.resolve(conversation?.turns || []);
    });

    mockConversationService.getConversationTurn.mockImplementation((conversationId, turnId) => {
      const conversation = mockConversations.find(c => c.id === conversationId);
      const turn = conversation?.turns.find(m => m.id === turnId);
      return Promise.resolve(turn || null);
    });

    mockConversationService.createConversationTurn.mockImplementation((conversationId, turnData) => {
      const conversation = mockConversations.find(c => c.id === conversationId);
      if (conversation) {
        const newTurn = {
          id: `turn-${Date.now()}`,
          createdAt: new Date().toISOString(),
          ...turnData,
        };
        conversation.turns.push(newTurn);
        conversation.updatedAt = new Date().toISOString();
        return Promise.resolve(newTurn);
      }
      return Promise.resolve(null);
    });

    mockConversationService.deleteConversationTurn.mockImplementation((conversationId, turnId) => {
      const conversation = mockConversations.find(c => c.id === conversationId);
      if (conversation) {
        const index = conversation.turns.findIndex(m => m.id === turnId);
        if (index !== -1) {
          conversation.turns.splice(index, 1);
          conversation.updatedAt = new Date().toISOString();
        }
      }
      return Promise.resolve(true);
    });

    mockConversationService.getParameterPresets.mockResolvedValue([
      {
        id: '1',
        name: 'Default',
        temperature: 0.7,
        topP: 1,
        maxTokens: 2000,
        presencePenalty: 0,
        frequencyPenalty: 0
      },
      {
        id: '2',
        name: 'Creative',
        temperature: 0.9,
        topP: 1,
        maxTokens: 3000,
        presencePenalty: 0.1,
        frequencyPenalty: 0.1
      }
    ]);

    mockConversationService.createParameterPreset.mockImplementation((presetData) => {
      const newPreset = {
        id: `preset-${Date.now()}`,
        ...presetData
      };
      return Promise.resolve(newPreset);
    });

    mockConversationService.deleteParameterPreset.mockImplementation(() => {
      return Promise.resolve(true);
    });

    mockModelService.getModels.mockResolvedValue([
      {
        id: '1',
        name: 'GPT-4',
        capabilities: ['chat']
      }
    ])


    mockModelService.getModelImplementations.mockImplementation((modelId: string) => {
      const implementations = [
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
        }
      ]
      return Promise.resolve([...implementations])
    })

    mockChatService.sendMultiModelMessage.mockImplementation((conversationId, messages, parameters) => {
      return Promise.resolve({
        turn_id: `turn-${Date.now()}`,
        responses: [
          {
            id: `response-${Date.now()}`,
            content: '测试响应',
            createdAt: new Date().toISOString(),
            model_implementation_id: '1',
            input_version_id: '1',
            model_implementation: {
              id: '1',
              provider_id: '1',
              model_id: '1',
              provider_model_id: 'gpt-4o',
              version: '2023-05',
              contextWindow: 128000,
              pricingInfo: {
                currency: 'USD',
                billingMode: 'token',
                inputPrice: 0.01,
                outputPrice: 0.03,
              },
              isAvailable: true,
            }
          }
        ]
      })
    })
    

    vi.clearAllMocks()

    // 渲染组件
    await renderWithRouter('/chat')
    await waitFor(() => expect(mockConversationService.getConversations).toHaveBeenCalled())
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Interface', () => {
    it('renders chat interface with conversation list and input area', () => {
      // 验证会话列表区域，使用更具体的选择器
      const sidebarHeading = screen.getByRole('heading', { name: '会话列表' })
      expect(sidebarHeading).toBeInTheDocument()

      // 验证输入区域
      expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument()

      // 使用更具体的选择器来定位发送按钮
      const sendButton = screen.getByRole('button', { name: /发送/ })
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe('Conversation Management', () => {
    it('creates new conversation', async () => {
      const newButton = screen.getByRole('button', { name: /新建会话/i })

      expect(screen.getByText(/测试会话1/)).toBeInTheDocument()

      await act(async () => {
        await userEvent.click(newButton)
      })
      // 验证新会话创建后的展示
      expect(screen.getByText(/新会话/)).toBeInTheDocument()
    })

    it('deletes conversation after confirmation', async () => {

      const deleteButtons = screen.getAllByRole('button', { name: /删除会话/ })
      await userEvent.click(deleteButtons[0])

      const confirmButton = screen.getByRole('button', { name: '是' })
      await userEvent.click(confirmButton)

      await waitFor(() => {
        expect(mockConversationService.deleteConversation).toHaveBeenCalledWith('1')
        expect(mockConversationService.getConversations).toHaveBeenCalledTimes(2)
      })

      expect(screen.queryByText('测试会话1')).not.toBeInTheDocument()
    })

    it('cancels conversation deletion', async () => {

      const deleteButtons = screen.getAllByRole('button', { name: /删除会话/ })
      await act(async () => {
        await userEvent.click(deleteButtons[0])
      })

      const cancelButton = screen.getByRole('button', { name: '否' })
      await act(async () => {
        await userEvent.click(cancelButton)
      })

      expect(mockConversationService.deleteConversation).not.toHaveBeenCalled()
      expect(screen.getByText('测试会话1')).toBeInTheDocument()
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
      await act(async () => {
        await userEvent.type(input, '测试消息')
      })
      expect(input).toHaveValue('测试消息')
      await act(async () => {
        await userEvent.click(sendButton)
      })
      
      // 验证输入框被清空
      expect(input).toHaveValue('')

      expect(mockChatService.sendMultiModelMessage).toHaveBeenCalled()
    })

    it('copies message content to clipboard', async () => {
      
      const copyButtons = screen.getAllByRole('button', { name: /复制/i })
      await act(async () => {
        await userEvent.click(copyButtons[0])
      })

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('你好!我能帮你什么?')
      expect(screen.getByText('已复制到剪贴板')).toBeInTheDocument()
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

    it('persists settings changes', async () => {

      const settingsButton = screen.getByRole('button', { name: '设置' })
      await act(async () => {
        await userEvent.click(settingsButton)
      })

      const tempInput = screen.getByRole('spinbutton', { name: /Temperature/i })
      await act(async () => {
        await userEvent.clear(tempInput)

        tempInput.focus()
        // Use fireEvent directly to set the value
        fireEvent.change(tempInput, { target: { value: '0.8' } })
      })

      expect(screen.getByRole('spinbutton', { name: /Temperature/i })).toHaveValue('0.8')
      await act(async () => {
        await userEvent.click(screen.getByRole('button', { name: /应 用/i }))

        await userEvent.click(settingsButton)
      })
      expect(screen.getByRole('spinbutton', { name: /Temperature/i })).toHaveValue('0.8')
    })


  })
})