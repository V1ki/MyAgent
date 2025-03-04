# 模型管理页面

## 系统架构概述

模型管理页面提供了对LLM模型及其不同实现的管理功能。页面通过后端API与数据库交互，实现模型和模型实现的增删改查操作。该模块支持多种模型提供商与其各自的模型实现，使系统能够灵活调用不同的AI能力。

## 数据模型类图
```mermaid
classDiagram
    class ModelProvider {
        id: string
        name: string
        baseUrl: string
        description: string
        apiKeys: ApiKey[]
    }
    
    class Model {
        id: string
        name: string
        description: string
        capabilities: string[]
        family: string
    }
    
    class ModelImplementation {
        id: string
        providerId: string
        modelId: string
        providerModelId: string
        version: string
        contextWindow: number
        pricingInfo: PricingInfo
        isAvailable: boolean
        customParameters: object
    }
    
    class PricingInfo {
        currency: string
        billingMode: string
        inputPrice: number
        outputPrice: number
        requestPrice: number
        minutePrice: number
        tiers: PricingTier[]
        specialFeatures: FeaturePricing[]
        freeAllowance: Allowance
        minimumCharge: number
        effectiveDate: string
        notes: string
    }

    class PricingTier {
        tierName: string
        volumeThreshold: number
        inputPrice: number
        outputPrice: number
        requestPrice: number
    }

    class FeaturePricing {
        featureName: string
        additionalPrice: number
        priceUnit: string
    }

    class Allowance {
        tokens: number
        requests: number
        validPeriod: string
    }
    
    class ApiKey {
        id: string
        providerId: string
        alias: string
        key: string
        keyPreview: string
    }
    
    ModelProvider "1" --> "*" ModelImplementation : provides
    Model "1" --> "*" ModelImplementation : implemented_as
    ModelProvider "1" --> "*" ApiKey : has
    ModelImplementation "1" --> "1" PricingInfo : has
    PricingInfo "1" --> "*" PricingTier : contains
    PricingInfo "1" --> "*" FeaturePricing : includes
    PricingInfo "1" --> "0..1" Allowance : offers
```

> For Examples:
### GPT-4o的不同实现
```yaml
Model: 
  id: "gpt-4o"
  name: "GPT-4o"
  family: "GPT-4"
  capabilities: ["text-generation", "function-calling"]

ModelImplementations:
  # OpenAI提供的两种不同级别的GPT-4o
  - providerId: "openai"
    modelId: "gpt-4o"
    providerModelId: "gpt-4o" 
    version: "2023-05"
    
  - providerId: "openai"
    modelId: "gpt-4o"
    providerModelId: "gpt-4o-mini" 
    version: "2023-05"
    
  # Azure提供的GPT-4o部署
  - providerId: "azure"
    modelId: "gpt-4o"
    providerModelId: "deployment-gpt4o"
    version: "2023-05"
```

## 前后端数据交互

```mermaid
sequenceDiagram
    participant User
    participant Component as Models Component
    participant Service as Model Service
    participant API as Backend API
    participant DB as Database
    
    User->>Component: 访问模型管理页面
    Component->>Service: 调用getModels()
    Service->>API: GET /api/models
    API->>DB: 查询所有模型
    DB-->>API: 返回模型数据
    API-->>Service: 返回模型列表
    Service-->>Component: 处理并返回前端格式数据
    Component-->>User: 显示模型列表
    
    User->>Component: 点击"添加模型"
    Component-->>User: 显示添加模型表单
    User->>Component: 填写并提交表单
    Component->>Service: 调用createModel(model)
    Service->>API: POST /api/models
    API->>DB: 创建新模型
    DB-->>API: 确认创建成功
    API-->>Service: 返回新创建的模型
    Service-->>Component: 处理并返回前端格式数据
    Component-->>User: 更新模型列表
    
    User->>Component: 点击"管理实现"
    Component->>Service: 调用getModelImplementations(modelId)
    Service->>API: GET /api/models/{modelId}/implementations
    API->>DB: 查询模型实现
    DB-->>API: 返回模型实现数据
    API-->>Service: 返回模型实现列表
    Service-->>Component: 处理并返回前端格式数据
    Component-->>User: 显示模型实现列表
    
    User->>Component: 点击"添加实现"
    Component-->>User: 显示添加实现表单
    User->>Component: 填写并提交表单
    Component->>Service: 调用createModelImplementation(implementation)
    Service->>API: POST /api/model-implementations
    API->>DB: 创建新模型实现
    DB-->>API: 确认创建成功
    API-->>Service: 返回新创建的模型实现
    Service-->>Component: 处理并返回前端格式数据
    Component-->>User: 更新模型实现列表
```

## 模型管理流程图

```mermaid
flowchart TD
    A[进入页面] --> B[调用API加载模型列表]
    B --> C{模型加载成功?}
    C -->|失败| D[显示错误提示]
    D --> E[用户点击重试]
    E --> B
    
    C -->|成功| F[显示模型列表]
    
    F --> G{选择操作}
    
    G -->|添加模型| H[打开添加模型模态框]
    H --> I[填写模型信息]
    I --> J[调用API创建模型]
    J --> K{API调用成功?}
    K -->|否| L[显示错误消息]
    L --> I
    K -->|是| M[更新模型列表]
    M --> F
    
    G -->|编辑模型| N[打开编辑模态框]
    N --> O[修改模型信息]
    O --> P[调用API更新模型]
    P --> Q{API调用成功?}
    Q -->|否| R[显示错误消息]
    R --> O
    Q -->|是| S[更新模型列表]
    S --> F
    
    G -->|删除模型| T[显示删除确认]
    T -->|确认| U[调用API删除模型]
    U --> V{API调用成功?}
    V -->|否| W[显示错误消息]
    W --> F
    V -->|是| X[从列表中移除]
    X --> F
    T -->|取消| F
    
    G -->|管理实现| Y[调用API获取模型实现]
    Y --> Z{API调用成功?}
    Z -->|否| AA[显示错误消息]
    AA --> AB[用户点击重试]
    AB --> Y
    Z -->|是| AC[显示实现管理界面]
```

## 模型实现管理流程图

```mermaid
flowchart TD
    A[进入模型实现管理] --> B[调用API加载模型实现]
    B --> C{加载成功?}
    C -->|否| D[显示错误提示]
    D --> E[用户点击重试]
    E --> B
    C -->|是| F[显示模型实现列表]
    
    F --> G{选择操作}
    
    G -->|添加实现| H[打开添加实现模态框]
    H --> I[填写实现信息]
    I --> J[调用API创建实现]
    J --> K{API调用成功?}
    K -->|否| L[显示错误消息]
    L --> I
    K -->|是| M[更新实现列表]
    M --> F
    
    G -->|编辑实现| N[打开编辑模态框]
    N --> O[修改实现信息]
    O --> P[调用API更新实现]
    P --> Q{API调用成功?}
    Q -->|否| R[显示错误消息]
    R --> O
    Q -->|是| S[更新实现列表]
    S --> F
    
    G -->|删除实现| T[显示删除确认]
    T -->|确认| U[调用API删除实现]
    U --> V{API调用成功?}
    V -->|否| W[显示错误消息]
    W --> F
    V -->|是| X[从列表中移除]
    X --> F
    T -->|取消| F
    
    G -->|返回| Y[返回模型管理页面]
```

## API与错误处理

模型管理页面集成了完善的错误处理机制：

1. **错误状态管理**：使用React状态管理错误消息，并在UI中展示友好的错误提示
2. **重试机制**：提供重试按钮，允许用户在遇到API错误时重新加载数据
3. **加载状态指示**：在异步操作过程中显示加载状态，提高用户体验

API调用通过专门的服务层（modelService）进行封装，实现前后端数据格式的转换与统一错误处理。

## 定价信息结构

```TypeScript
interface PricingInfo {
  // 基础计费信息
  currency: string; // 货币单位，如 "USD", "CNY"
  billingMode: "token" | "request" | "minute" | "hybrid"; // 计费模式
  
  // 基于Token的计费
  inputPrice?: number; // 每千输入token的价格
  outputPrice?: number; // 每千输出token的价格
  
  // 基于请求的计费
  requestPrice?: number; // 每次请求的价格
  
  // 基于时间的计费（如语音/视频模型）
  minutePrice?: number; // 每分钟的价格
  
  // 分级定价
  tiers?: {
    tierName: string; // 如 "Free", "Standard", "Premium"
    volumeThreshold: number; // 用量阈值
    inputPrice?: number; // 此级别的输入价格
    outputPrice?: number; // 此级别的输出价格
    requestPrice?: number; // 此级别的请求价格
  }[];
  
  // 附加功能定价
  specialFeatures?: {
    featureName: string; // 如 "function-calling", "vision", "embedding"
    additionalPrice: number; // 附加价格
    priceUnit: string; // 价格单位，如 "per request", "per 1K tokens"
  }[];
  
  // 免费额度信息
  freeAllowance?: {
    tokens?: number; // 免费token数量
    requests?: number; // 免费请求数量
    validPeriod?: string; // 有效期，如 "daily", "monthly"
  };
  
  // 额外信息
  minimumCharge?: number; // 最小收费金额
  effectiveDate?: string; // 价格生效日期
  notes?: string; // 额外说明
}
```

## 组件状态管理

模型管理页面使用 React 的状态管理机制来处理复杂的页面状态：

1. **模型列表状态**
   - `models`: 模型对象数组，存储从API获取的所有模型
   - `selectedModel`: 当前选中的模型对象，用于编辑或管理实现
   - `loading`: 布尔值，表示是否正在加载数据
   - `error`: 错误对象，存储API请求错误信息

2. **模态框状态**
   - `isModelModalVisible`: 控制添加/编辑模型模态框的显示
   - `isImplementationModalVisible`: 控制添加/编辑模型实现模态框的显示
   - `isConfirmDeleteVisible`: 控制删除确认对话框的显示
   - `modalMode`: 枚举值('add'|'edit')，表示当前模态框的模式

3. **模型实现状态**
   - `implementations`: 模型实现对象数组，存储当前选中模型的所有实现
   - `selectedImplementation`: 当前选中的模型实现对象，用于编辑操作
   - `implementationsLoading`: 布尔值，表示是否正在加载模型实现
   - `implementationsError`: 错误对象，存储获取模型实现时的错误信息

4. **表单状态**
   - `modelForm`: 模型表单引用，用于处理表单验证和提交
   - `implementationForm`: 模型实现表单引用，用于处理表单验证和提交
   - `formErrors`: 对象，存储表单验证错误信息
   - `submitting`: 布尔值，表示表单是否正在提交

状态更新通过以下流程进行：
- 组件挂载时，触发模型列表初始加载
- 用户交互操作(点击、提交表单等)触发状态更新
- 状态变化导致UI重新渲染，展示最新数据
- API操作完成后，更新相关状态并刷新UI

## 主要组件结构

```
Models/
  ├── index.tsx                     # 模型管理主页面
  ├── Models.test.tsx               # 模型管理测试用例
  ├── Readme.md                     # 组件文档
  │
  ├── components/                   # 模型实现相关组件
  │   ├── ModelForm.tsx             # 模型编辑/创建表单组件
  │   ├── ModelList.tsx             # 模型列表展示组件
  │   ├── ImplementationForm.tsx    # 实现编辑/创建表单
  │   └── ImplementationList.tsx    # 实现列表展示组件
  │
  ├── hooks/                        # 自定义钩子
  │   ├── useModels.tsx             # 模型数据管理钩子
  │   └── useImplementations.tsx    # 实现数据管理钩子
  |
  └── types/
      └── index.ts               # 类型定义文件

```

