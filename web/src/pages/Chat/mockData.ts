import { Conversation } from './types';

export const mockModels = [
  { id: 'gpt-4', name: 'GPT-4' },
  { id: 'gpt-3.5', name: 'GPT-3.5' },
  { id: 'claude-2', name: 'Claude 2' },
  { id: 'llama-2', name: 'Llama 2' },
  { id: 'qwen', name: 'Qwen' },
];

export const mockConversations = [
  { id: '1', title: 'AI模型工作原理探讨', isActive: true },
  { id: '2', title: '自然语言处理应用场景' },
  { id: '3', title: '大模型性能优化策略' },
];

export const mockParameterPresets = [
  {
    id: '1',
    name: '默认设置',
    parameters: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 2048,
      frequencyPenalty: 0,
      presencePenalty: 0,
    }
  },
  {
    id: '2',
    name: '创意写作',
    parameters: {
      temperature: 1.2,
      topP: 0.95,
      maxTokens: 3072,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
    }
  },
  {
    id: '3',
    name: '精确回答',
    parameters: {
      temperature: 0.3,
      topP: 0.8,
      maxTokens: 1024,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
    }
  }
];

export const mockConversation: Conversation = {
  id: '1',
  title: '测试对话',
  turns: [
    {
      id: '1',
      userMessage: {
        content: '我想了解大型语言模型的工作原理和应用领域...',
        timestamp: '12:35 PM',
        tokenCount: 43
      },
      modelResponses: [
        {
          modelId: 'gpt-4',
          modelName: 'GPT-4',
          content: '大型语言模型（LLM）是一种基于深度学习的AI系统，它通过分析大量文本数据来学习语言的模式和规律。主要工作原理包括：\n\n1. 预训练：通过分析互联网上的大量文本来学习语言知识\n2. 注意力机制：能够理解句子中各个词之间的关系\n3. 上下文学习：能够根据上下文理解词语的具体含义\n\n主要应用领域包括：\n- 自然语言理解与生成\n- 对话系统与聊天机器人\n- 文本分析与摘要\n- 代码生成与分析\n- 辅助创作与内容生成',
          tokenCount: 152,
          responseTime: 2.3,
          timestamp: '12:35 PM'
        },
        {
          modelId: 'gpt-3.5',
          modelName: 'GPT-3.5',
          content: '大型语言模型是一种人工智能模型，能够理解和生成人类语言。它们的应用非常广泛，包括：\n\n- 智能助手和聊天机器人\n- 文本翻译和总结\n- 内容创作和编辑\n- 代码编写辅助\n- 问答系统',
          tokenCount: 165,
          responseTime: 1.8,
          timestamp: '12:35 PM'
        },
        {
          modelId: 'claude-2',
          modelName: 'Claude 2',
          content: '大型语言模型（Large Language Models, LLMs）是基于深度学习的自然语言处理系统。这些模型通过分析大量文本数据来学习语言规律，从而能够理解和生成人类语言。\n\n工作原理：\n1. Transformer架构\n2. 自注意力机制\n3. 上下文理解\n\n应用领域：\n1. 智能对话\n2. 文本分析\n3. 知识问答\n4. 代码辅助\n5. 创意写作',
          tokenCount: 143,
          responseTime: 2.1,
          timestamp: '12:35 PM'
        }
      ],
      selectedModelId: 'gpt-4'
    }
  ]
};