# 模型提供商相关功能设计

## 数据模型类图
```mermaid
classDiagram
    class ModelProvider {
        id: string
        name: string
        baseUrl: string
        description: string (optional, max 200 chars)
        apiKeys: ApiKey[]
    }
    
    class ApiKey {
        id: string
        alias: string
        key: string
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
    
    
    ModelProvider "1" --> "*" ApiKey : contains

    ModelProvider "1" --> "*" ModelImplementation : provides
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


## 提供商管理流程图

```mermaid
flowchart TD
    A[进入页面] --> B[查看提供商列表]
    B --> C{选择操作}
    
    C -->|添加提供商| D[打开添加提供商模态框]
    D --> E[填写提供商信息]
    E --> F{填写初始密钥?}
    F -->|是| G[填写初始密钥信息]
    F -->|否| H[提交表单]
    G --> H
    H --> B
    
    C -->|编辑提供商| I[打开编辑模态框]
    I --> J[修改提供商信息]
    J --> K[提交表单]
    K --> B
    
    C -->|删除提供商| L[显示删除确认]
    L -->|确认| M[删除提供商]
    L -->|取消| B
    M --> B
    
    C -->|管理密钥| N[进入密钥管理界面]
```

## API密钥管理流程图
```mermaid
flowchart TD
    A[进入密钥管理] --> B{选择操作}
    
    B -->|添加密钥| C[打开添加密钥模态框]
    C --> D[填写密钥信息]
    D --> E[提交表单]
    E --> A
    
    B -->|编辑密钥| F[打开编辑密钥模态框]
    F --> G[修改密钥信息]
    G --> H[提交表单]
    H --> A
    
    B -->|删除密钥| I[显示删除确认]
    I -->|确认| J[删除密钥]
    I -->|取消| A
    J --> A
    
    B -->|返回| K[返回提供商列表]
```

## 组件状态管理
该组件使用`React`的`useState`钩子管理以下状态:

- `providers`: `ModelProvider`对象数组
- `isModalVisible`: 提供商模态框是否可见
- `isKeyModalVisible`: 密钥模态框是否可见
- `editingProviderId`: 正在编辑的提供商ID(为`null`时表示新增)
- `currentProvider`: 当前正在管理密钥的提供商
- `editingKeyId`: 正在编辑的密钥ID(为`null`时表示新增)