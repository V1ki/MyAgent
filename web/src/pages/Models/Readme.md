# 模型管理页面


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
        pricingInfo: object
        isAvailable: boolean
        customParameters: object
    }
    
    ModelProvider "1" --> "*" ModelImplementation : provides
    Model "1" --> "*" ModelImplementation : implemented_as

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

### 关于 `PricingInfo` 的一些考虑
```mermaid
classDiagram
    class ModelImplementation {
    }
    
    class PricingInfo {
        currency: string
        billingMode: "token"|"request"|"minute"|"hybrid"
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
    ModelImplementation "1" --> "1" PricingInfo : has
    PricingInfo "1" --> "*" PricingTier : contains
    PricingInfo "1" --> "*" FeaturePricing : includes
    PricingInfo "1" --> "0..1" Allowance : offers

```

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


## 模型管理流程图

```mermaid
flowchart TD
    A[进入页面] --> B[查看模型列表]
    B --> C{选择操作}
    
    C -->|添加模型| D[打开添加模型模态框]
    D --> E[填写模型信息]
    E --> F{是否选择默认的提供商?}
    F -->|是| G[选择默认的提供商]
    F -->|否| H[提交表单]
    G --> H
    H --> B
    
    C -->|编辑模型| I[打开编辑模态框]
    I --> J[修改模型信息]
    J --> K[提交表单]
    K --> B
    
    C -->|删除模型| L[显示删除确认]
    L -->|确认| M[删除模型]
    L -->|取消| B
    M --> B
    
    C -->|管理提供商| N[进入模型-提供商管理界面]
```

## 模型-提供商管理流程
```mermaid
flowchart TD
    A[进入模型-提供商管理界面] --> B{选择操作}
    
    B -->|添加模型-提供商| C[打开添加模型-提供商模态框]
    C --> D[填写模型-提供商信息]
    D --> E[提交表单]
    E --> A
    
    B -->|编辑模型-提供商| F[打开编辑模型-提供商模态框]
    F --> G[修改模型-提供商信息]
    G --> H[提交表单]
    H --> A
    
    B -->|删除模型-提供商| I[显示删除确认]
    I -->|确认| J[删除模型-提供商]
    I -->|取消| A
    J --> A
    
    B -->|返回| K[返回模型列表]
```

