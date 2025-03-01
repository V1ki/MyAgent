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