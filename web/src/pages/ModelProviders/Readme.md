# 模型提供商相关功能设计

## 数据模型类图
```mermaid
classDiagram
    %% Frontend Models
    class FrontendModelProvider {
        id: string
        name: string
        baseUrl: string
        description: string (optional, max 200 chars)
        apiKeys: FrontendApiKey[]
    }
    
    class FrontendApiKey {
        id: string
        alias: string
        key: string
    }
    
    %% Backend Models (API接口模型)
    class ModelProvider {
        id: string
        name: string
        base_url: string
        description: string (optional)
        api_keys: ApiKey[] (只在详情查询中返回)
    }
    
    class ApiKey {
        id: string
        provider_id: string
        alias: string
        key_preview: string (显示的掩码密钥)
        key: string (只在创建/更新时使用)
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
    
    FrontendModelProvider ..> ModelProvider : 从后端数据转换
    FrontendApiKey ..> ApiKey : 从后端数据转换
    ModelProvider "1" --> "*" ApiKey : contains
    ModelProvider "1" --> "*" ModelImplementation : provides
```

## 后端API集成
该组件使用原生的Fetch API与后端进行交互，替换了原来的硬编码数据模式。主要使用以下API端点：

### 提供商API

- `GET /providers/` - 获取所有提供商列表
- `GET /providers/{provider_id}` - 获取单个提供商及其API密钥详情
- `POST /providers/` - 创建新的提供商
- `PUT /providers/{provider_id}` - 更新提供商信息
- `DELETE /providers/{provider_id}` - 删除提供商

### API密钥API

- `GET /providers/{provider_id}/keys` - 获取提供商的所有API密钥
- `POST /providers/{provider_id}/keys` - 为提供商添加新的API密钥
- `PUT /keys/{key_id}` - 更新API密钥信息
- `DELETE /keys/{key_id}` - 删除API密钥

## 提供商管理流程图（带API调用）
```mermaid
flowchart TD
    A[进入页面] --> A1[调用GET /providers/ 获取提供商列表]
    A1 --> B[展示提供商列表]
    B --> C{选择操作}
    
    C -->|添加提供商| D[打开添加提供商模态框]
    D --> E[填写提供商信息]
    E --> F{填写初始密钥?}
    F -->|是| G[填写初始密钥信息]
    F -->|否| H1[调用POST /providers/ 提交表单]
    G --> H1
    H1 --> H2[调用GET /providers/ 刷新列表]
    H2 --> B
    
    C -->|编辑提供商| I[打开编辑模态框]
    I --> J[修改提供商信息]
    J --> K1[调用PUT /providers/id 提交表单]
    K1 --> K2[调用GET /providers/id 刷新数据]
    K2 --> B
    
    C -->|删除提供商| L[显示删除确认]
    L -->|确认| M[调用DELETE /providers/id 删除提供商]
    L -->|取消| B
    M --> B
    
    C -->|管理密钥| N1[调用GET /providers/id 获取详情]
    N1 --> N2[进入密钥管理界面]
```

## API密钥管理流程图（带API调用）
```mermaid
flowchart TD
    A1[调用GET /providers/id 获取提供商详情] --> A[进入密钥管理]
    A --> B{选择操作}
    
    B -->|添加密钥| C[打开添加密钥模态框]
    C --> D[填写密钥信息]
    D --> E1[调用POST /providers/id/keys 提交表单]
    E1 --> E2[调用GET /providers/id 刷新数据]
    E2 --> A
    
    B -->|编辑密钥| F[打开编辑密钥模态框]
    F --> G[修改密钥信息]
    G --> H1[调用PUT /keys/key_id 提交表单]
    H1 --> H2[调用GET /providers/id 刷新数据]
    H2 --> A
    
    B -->|删除密钥| I[显示删除确认]
    I -->|确认| J1[调用DELETE /keys/key_id 删除密钥]
    I -->|取消| A
    J1 --> J2[调用GET /providers/id 刷新数据]
    J2 --> A
    
    B -->|返回| K[返回提供商列表]
```

## 添加提供商的序列图
```mermaid
sequenceDiagram
    actor User as 用户
    participant UI as 用户界面
    participant API as 后端API
    participant DB as 数据库
    
    User->>UI: 点击"添加提供商"按钮
    UI->>User: 显示添加提供商模态框
    User->>UI: 输入提供商信息（含初始密钥）
    User->>UI: 点击确认按钮
    UI->>API: POST /providers/ {name, base_url, description, initial_key}
    API->>DB: 创建新的提供商记录
    Note over API,DB: 如果提供了初始密钥，也会创建密钥记录
    DB-->>API: 返回创建成功
    API-->>UI: 返回新创建的提供商数据
    UI->>API: GET /providers/ 刷新列表
    API->>DB: 查询所有提供商
    DB-->>API: 返回提供商列表
    API-->>UI: 返回提供商列表数据
    UI->>User: 更新UI显示，提示创建成功
```

## 管理密钥的序列图
```mermaid
sequenceDiagram
    actor User as 用户
    participant UI as 用户界面
    participant API as 后端API
    participant DB as 数据库
    
    User->>UI: 点击"管理密钥"按钮
    UI->>API: GET /providers/id 获取提供商详情
    API->>DB: 查询提供商及其密钥
    DB-->>API: 返回提供商和密钥数据
    API-->>UI: 返回包含密钥的提供商详情
    UI->>User: 显示密钥管理界面
    
    %% 添加密钥流程
    User->>UI: 点击"添加密钥"按钮
    UI->>User: 显示添加密钥模态框
    User->>UI: 填写密钥信息
    User->>UI: 点击确认按钮
    UI->>API: POST /providers/id/keys {alias, key}
    API->>DB: 创建新的密钥记录
    DB-->>API: 返回创建成功
    API-->>UI: 返回新创建的密钥数据
    UI->>API: GET /providers/id 刷新数据
    API->>DB: 再次查询提供商及其密钥
    DB-->>API: 返回最新的提供商和密钥数据
    API-->>UI: 返回更新后的数据
    UI->>User: 更新UI显示，提示创建成功
```

## 错误处理

该组件实现了完善的错误处理机制：

- 加载状态显示（使用`loading`状态）
- API请求错误处理（错误信息展示与重试功能）
- 表单验证错误处理
- 用户操作反馈（成功/失败消息）

## 组件状态管理
该组件使用`React`的`useState`钩子管理以下状态:
- `providers`: `FrontendModelProvider`对象数组
- `loading`: 表示正在进行API请求
- `error`: 保存API请求错误信息
- `isModalVisible`: 提供商模态框是否可见
- `isKeyModalVisible`: 密钥模态框是否可见
- `editingProviderId`: 正在编辑的提供商ID(为`null`时表示新增)
- `currentProvider`: 当前正在管理密钥的提供商
- `editingKeyId`: 正在编辑的密钥ID(为`null`时表示新增)

## 主要组件结构

```
ModelProviders/
  ├── index.tsx                  # 模型提供商页面主入口
  ├── ModelProviders.test.tsx    # 组件测试文件
  ├── Readme.md                  # 组件文档
  │
  ├── components/
  │   ├── ProviderList.tsx       # 提供商列表组件
  │   ├── ProviderForm.tsx       # 提供商添加/编辑表单
  │   ├── ProviderDetail.tsx     # 提供商详情展示
  │   ├── ApiKeyList.tsx         # API密钥列表组件
  │   └── ApiKeyForm.tsx         # API密钥添加/编辑表单
  │
  ├── hooks/
  │   ├── useProviders.tsx       # 提供商数据管理钩子
  │   └── useApiKeys.tsx         # API密钥管理钩子
  │
  └── types/
      └── index.ts               # 类型定义文件
```

基本组件结构说明:

1. **index.tsx**: 主页面组件，负责整体布局与状态管理，协调子组件之间的交互。

2. **组件层 (components/)**: 
   - **ProviderList**: 展示所有模型提供商，支持搜索、排序，与选择操作
   - **ProviderForm**: 用于创建和编辑提供商信息的表单组件，包含验证逻辑
   - **ProviderDetail**: 展示提供商详细信息，包括相关API密钥列表
   - **ApiKeyList**: 展示指定提供商的API密钥列表
   - **ApiKeyForm**: 用于添加和编辑API密钥的表单组件

3. **Hooks层 (hooks/)**: 
   - **useProviders**: 封装与提供商相关的状态管理和API调用
   - **useApiKeys**: 封装与API密钥相关的状态管理和API调用

4. **服务层 (services/)**: 
   - **providerService**: 处理与后端提供商API的通信
   - **apiKeyService**: 处理与后端API密钥相关的API调用

5. **类型定义 (types/)**: 
   - 定义前端使用的所有类型，包括提供商、API密钥等TS接口