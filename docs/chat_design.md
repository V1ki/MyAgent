# 多模型对比聊天界面设计方案

## 1. 概述

本文档描述了一个基于现有模型提供商、API Key、模型和模型实现组件的聊天界面系统。该系统不仅支持基本的聊天功能，还允许用户同时选择多个模型对同一问题进行回答，比较不同模型的响应质量，并可以选择某个特定模型的回答作为后续对话的上下文。系统还支持高级功能如每轮对话参数独立设置、提问编辑与版本历史管理等。

## 2. 系统架构

```mermaid
graph TD
    subgraph "前端"
        Chat[聊天界面]
        ModelSelector[多模型选择器]
        ContextSelector[上下文选择器]
        ComparisonView[模型对比视图]
        Settings[设置面板]
    end
    
    subgraph "后端"
        ChatAPI[聊天服务API]
        ConvAPI[会话管理API]
        ModelOrchestrator[模型协调器]
        ExistingAPI[现有模型提供商/模型API]
    end
    
    subgraph "数据存储"
        DB[(数据库)]
    end
    
    Chat <--> ChatAPI
    ModelSelector <--> ModelOrchestrator
    ContextSelector <--> ConvAPI
    ComparisonView <--> ChatAPI
    Settings <--> ExistingAPI
    
    ChatAPI <--> ModelOrchestrator
    ModelOrchestrator <--> ExistingAPI
    ChatAPI <--> DB
    ConvAPI <--> DB
    ExistingAPI <--> DB
```

## 3. 数据模型

### 3.1 核心数据模型

```mermaid
classDiagram
    class Conversation {
        +UUID id
        +String title
        +DateTime created_at
        +DateTime updated_at
        +UUID user_id
        +String system_prompt
        +Boolean is_multi_model
        +List[ConversationTurn] turns
    }
    
    class ConversationTurn {
        +UUID id
        +UUID conversation_id
        +String user_input
        +DateTime created_at
        +DateTime modified_at
        +Boolean is_deleted
        +JSON model_parameters
        +UUID active_response_id
        +List[ModelResponse] responses
        +List[UserInputVersion] input_versions
    }
    
    class UserInputVersion {
        +UUID id
        +UUID turn_id
        +String content
        +DateTime created_at
        +JSON model_parameters
        +Boolean is_current
    }
    
    class ModelResponse {
        +UUID id
        +UUID turn_id
        +UUID model_implementation_id
        +String content
        +DateTime created_at
        +Boolean is_selected
        +Boolean is_deleted
        +JSON metadata
        +UUID input_version_id
    }
    
    class ModelParameters {
        +Float temperature
        +Int top_p
        +Int max_tokens
        +Float presence_penalty
        +Float frequency_penalty
        +String stop_sequences
        +Additional model_specific_params
    }
    
    class ChatPreference {
        +UUID user_id
        +List~UUID~ default_model_implementations
        +JSON default_parameters
        +Boolean stream_responses
        +Theme theme
    }
    
    class ParameterPreset {
        +UUID id
        +String name
        +String description
        +UUID user_id
        +ModelParameters parameters
        +UUID model_implementation_id
        +DateTime created_at
    }
    
    Conversation "1" --> "*" ConversationTurn : contains
    ConversationTurn "1" --> "*" ModelResponse : has
    ConversationTurn "1" --> "1" ModelParameters : configured_with
    ConversationTurn "1" --> "*" UserInputVersion : has_versions
    UserInputVersion "1" --> "*" ModelResponse : generated
    ModelImplementation "1" --> "*" ModelResponse : generated_by
    ParameterPreset "0..*" <-- "1" User : creates
    ConversationTurn "1" o-- "0..1" ParameterPreset : uses
```

### 3.2 与现有模型的关系

```mermaid
classDiagram
    class ModelProvider {
        +UUID id
        +String name
        +String baseUrl
        +String description
        +List~ApiKey~ apiKeys
    }
    
    class ApiKey {
        +UUID id
        +UUID providerId
        +String alias
        +String key
    }
    
    class Model {
        +UUID id
        +String name
        +String description
        +String[] capabilities
        +String family
    }
    
    class ModelImplementation {
        +UUID id
        +UUID providerId
        +UUID modelId
        +String providerModelId
        +String version
        +Integer contextWindow
        +PricingInfo pricingInfo
        +Boolean isAvailable
    }
    
    ModelProvider "1" --> "*" ApiKey : has
    ModelProvider "1" --> "*" ModelImplementation : provides
    Model "1" --> "*" ModelImplementation : implemented_as
    ModelImplementation "1" --> "*" ModelResponse : generates
```

## 4. 前端界面设计

### 4.1 页面布局

```mermaid
graph TD
    subgraph "多模型聊天界面"
        Header[顶部栏: 当前会话标题]
        SideNav[侧边栏: 会话列表]
        
        subgraph "主内容区"
            UserInput[用户输入区域]
            
            subgraph "模型回答区(网格/标签页布局)"
                Response1[模型1回答]
                Response2[模型2回答]
                Response3[模型3回答]
            end
            
            ContextSelector[上下文选择器: 选择哪个模型回答作为上下文]
        end
        
        ModelSelector[底部: 多模型选择器]
    end
```

### 4.2 对话轮次组件结构

```mermaid
graph TD
    subgraph "对话轮次组件"
        UserInput[用户提问区域]
        UserControls[提问控制按钮组]
        ParamsIndicator[参数指示器]
        
        subgraph "模型回答区"
            Response1[模型1回答]
            Response2[模型2回答]
            Response3[模型3回答]
        end
        
        TurnActions[轮次操作按钮组]
    end
    
    UserControls --> EditBtn[编辑按钮]
    UserControls --> DeleteBtn[删除按钮]
    UserControls --> ParamsBtn[参数按钮]
    
    Response1 --> Resp1Actions[回答1操作]
    Response2 --> Resp2Actions[回答2操作]
    Response3 --> Resp3Actions[回答3操作]
    
    Resp1Actions --> DeleteResp1[删除回答]
    Resp1Actions --> CopyResp1[复制回答]
    Resp1Actions --> SelectResp1[选为上下文]
    
    TurnActions --> RegenerateBtn[重新生成]
    TurnActions --> CollapseBtn[折叠/展开]
```

### 4.3 参数设置面板

```mermaid
graph TD
    subgraph "参数设置面板"
        TempSlider[温度滑块: 0-2]
        TopPSlider[Top-p滑块: 0-1]
        MaxTokensInput[最大Token输入框]
        FreqPenalty[频率惩罚滑块]
        PresPenalty[存在惩罚滑块]
        StopSeqInput[停止序列输入框]
        ModelSpecific[模型特定参数区]
        
        SavePreset[保存为预设按钮]
        LoadPreset[加载预设按钮]
        ApplyBtn[应用按钮]
        CancelBtn[取消按钮]
    end
    
    TempSlider --> TempValue[温度值: 0.7]
    TopPSlider --> TopPValue[Top-p值: 0.9]
    ModelSpecific --> Qwen[Qwen特定参数]
    ModelSpecific --> Claude[Claude特定参数]
    ModelSpecific --> GLM[GLM特定参数]
```

## 5. 关键流程

### 5.1 多模型同时回答流程

```mermaid
sequenceDiagram
    actor User as 用户
    participant UI as 聊天界面
    participant API as 后端API
    participant Orchestrator as 模型协调器
    participant Models as 多模型服务
    participant DB as 数据库
    
    User->>UI: 选择多个模型
    User->>UI: 输入问题
    UI->>API: POST /chat/multi 请求
    
    API->>DB: 保存用户问题
    API->>Orchestrator: 发送到模型协调器
    
    par 并行处理
        Orchestrator->>Models: 请求模型A
        Models-->>Orchestrator: 模型A响应
        
        Orchestrator->>Models: 请求模型B
        Models-->>Orchestrator: 模型B响应
        
        Orchestrator->>Models: 请求模型C
        Models-->>Orchestrator: 模型C响应
    end
    
    Orchestrator-->>API: 汇总所有模型响应
    API->>DB: 保存所有响应
    API-->>UI: 返回所有模型的回答
    
    UI->>UI: 以网格/标签页形式显示多模型回答
    UI->>User: 显示完整对比界面
```

### 5.2 流式响应处理

```mermaid
sequenceDiagram
    actor User as 用户
    participant UI as 聊天界面
    participant API as 后端API
    participant SSE as SSE连接
    participant Models as 多模型服务
    
    User->>UI: 输入问题
    UI->>API: 建立多路SSE连接
    
    par 并行流式处理
        API->>SSE: 创建模型A的SSE流
        loop 模型A流式输出
            Models-->>SSE: 模型A部分响应
            SSE-->>UI: 推送模型A部分响应
            UI->>UI: 更新模型A响应区域
        end
        
        API->>SSE: 创建模型B的SSE流
        loop 模型B流式输出
            Models-->>SSE: 模型B部分响应
            SSE-->>UI: 推送模型B部分响应
            UI->>UI: 更新模型B响应区域
        end
    end
    
    UI->>User: 显示所有模型的完整回答
    UI->>UI: 启用上下文选择功能
```

### 5.3 编辑提问并保留历史版本

```mermaid
sequenceDiagram
    actor User as 用户
    participant UI as 聊天界面
    participant API as 后端API
    participant Models as 模型服务
    participant DB as 数据库
    
    User->>UI: 点击提问编辑按钮
    UI->>UI: 显示编辑界面
    User->>UI: 修改提问内容
    User->>UI: 点击参数设置按钮
    UI->>UI: 显示参数面板
    User->>UI: 调整temperature等参数
    User->>UI: 确认参数设置
    User->>UI: 点击"保存并重新生成"
    
    UI->>API: POST /api/turns/{id}/versions
    API->>DB: 保存原提问作为历史版本
    API->>DB: 创建新版本提问
    UI->>API: PUT /api/turns/{id}/parameters
    API->>DB: 更新参数设置
    UI->>API: POST /api/turns/{id}/regenerate
    
    API->>DB: 标记当前版本关联的回答
    API->>Models: 发送更新后的提问和参数
    
    par 并行处理多个模型
        Models->>Models: 模型A生成回答
        Models->>Models: 模型B生成回答
        Models->>Models: 模型C生成回答
    end
    
    Models-->>API: 返回新生成的回答
    API->>DB: 保存新回答并关联到新版本
    API-->>UI: 返回成功状态和新回答
    UI->>UI: 显示新版本提问和回答
    UI->>UI: 显示"查看历史版本"按钮
```

### 5.4 提问版本切换流程

```mermaid
flowchart TD
    A[用户点击查看历史版本] --> B[显示版本选择器]
    B --> C[用户通过左右箭头在版本间切换]
    C --> D{是浏览还是选择}
    D -->|浏览| E[临时显示选定版本的提问和回答]
    D -->|选择| F[切换到该版本作为当前显示]
    E --> G[显示使用此版本按钮]
    G --> H[用户点击使用此版本]
    H --> F
    F --> I[更新UI显示选定版本]
    I --> J[将选定版本标记为当前版本]
```

### 5.5 删除回答后的上下文管理

```mermaid
flowchart TD
    A[用户删除模型回答] --> B{该回答是否为当前上下文?}
    B -->|否| C[仅删除该回答]
    B -->|是| D[需要重新选择上下文]
    
    D --> E{其他回答是否存在?}
    E -->|是| F[提示用户选择新上下文]
    E -->|否| G[清除上下文状态]
    
    F --> H[用户选择其他回答作为上下文]
    G --> I[后续对话使用原始上下文]
    H --> I
    
    C --> J[视觉上隐藏回答]
    I --> J
```

## 6. API接口设计

### 6.1 多模型聊天接口

```
POST /api/chat/multi
GET /api/conversations/{id}/turns
POST /api/conversations/{id}/turns
PUT /api/conversations/{id}/turns/{turn_id}/select-response/{response_id}
```

### 6.2 流式响应接口

```
GET /api/chat/multi/stream?models=model1,model2,model3&message=<message>
```

### 6.3 编辑与版本管理接口

```
// 提问版本管理
POST /api/turns/{turn_id}/versions           // 创建新版本
GET /api/turns/{turn_id}/versions            // 获取所有版本
GET /api/turns/{turn_id}/versions/{version_id}  // 获取特定版本
PUT /api/turns/{turn_id}/versions/{version_id}/set-current  // 设置当前版本

// 参数管理
PUT /api/turns/{turn_id}/parameters
DELETE /api/turns/{turn_id}
DELETE /api/responses/{response_id}
POST /api/turns/{turn_id}/regenerate
```

### 6.4 参数预设管理接口

```
GET /api/parameter-presets
POST /api/parameter-presets
GET /api/parameter-presets/{id}
PUT /api/parameter-presets/{id}
DELETE /api/parameter-presets/{id}
```

## 7. 用户界面元素

### 7.1 提问编辑与参数设置UI

当用户点击编辑按钮时，提问区域转变为可编辑状态，并在底部显示参数设置按钮：

```
┌─────────────────────────────────────────────────────────┐
│ [用户头像]                                     12:34 PM │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [编辑框] 我想了解大型语言模型的内部工作原理...     │ │
│ │                                                     │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────┐ ┌──────────┐ ┌───────────────────────┐ │
│ │ 参数设置 ⚙️ │ │ 取消编辑 │ │ 保存并重新生成回答 ▶ │ │
│ └─────────────┘ └──────────┘ └───────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 7.2 参数设置面板UI

```
┌─────────────────────────────────────────────────────────┐
│ 生成参数设置                                    [关闭] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Temperature                                             │
│ [····●···················································] │
│ 0.7                                                     │
│                                                         │
│ Top-p                                                   │
│ [····················●·······························] │
│ 0.9                                                     │
│                                                         │
│ Max Tokens                                              │
│ [______2048______]                                      │
│                                                         │
│ Frequency Penalty                                       │
│ [··············●·········································] │
│ 0.5                                                     │
│                                                         │
│ ➕ 更多参数                                             │
│                                                         │
│ 预设: [默认参数 ▼]  [保存为新预设]                     │
│                                                         │
│ ┌──────────┐ ┌──────────────────────────┐              │
│ │   取消   │ │ 应用到当前提问并保存 ✓  │              │
│ └──────────┘ └──────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

### 7.3 提问版本历史管理UI

提问被编辑时，显示版本历史：

```
┌─────────────────────────────────────────────────────────┐
│ [用户头像]                             12:34 PM (已编辑) │
│                                                         │
│ 我想了解大型语言模型的工作原理和训练方法...            │
│                                                         │
│ ┌───────────────────────────────────────────────────┐   │
│ │ 版本 3/3  ◀ ▶   版本历史                         │   │
│ └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

版本历史查看界面：

```
┌─────────────────────────────────────────────────────────┐
│ 提问历史版本                                    [关闭] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 版本 2/3   ◀ 前一版本 | 后一版本 ▶                    │
│                                                         │
│ 创建时间: 2023-06-15 14:23                             │
│                                                         │
│ 我想了解大型语言模型的工作机制和应用领域...            │
│                                                         │
│ 参数:                                                  │
│ Temperature: 0.7                                        │
│ Top-p: 0.9                                              │
│ Max Tokens: 2048                                        │
│                                                         │
│ ┌────────────────────┐ ┌────────────────────────────┐  │
│ │ 预览此版本的回答  │ │ 将此版本设为当前版本 ✓    │  │
│ └────────────────────┘ └────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 7.4 已删除和已编辑消息的显示

提问被删除时：
```
┌─────────────────────────────────────────────────────────┐
│ [用户头像]                                     12:34 PM │
│                                                         │
│ 此消息已删除                      [恢复] [永久删除]     │
└─────────────────────────────────────────────────────────┘
```

提问被编辑时：
```
┌─────────────────────────────────────────────────────────┐
│ [用户头像]                             12:34 PM (已编辑) │
│                                                         │
│ 我想了解大型语言模型的工作原理和训练方法...            │
│                                                         │
│ [查看编辑历史]                                          │
└─────────────────────────────────────────────────────────┘
```

## 8. 实现计划

### 8.1 阶段一：基础多模型对比功能
1. 创建会话和对话轮次数据结构
2. 实现多模型选择器
3. 开发基础多模型聊天界面
4. 实现并行模型调用机制

### 8.2 阶段二：上下文选择功能
1. 增加上下文选择UI
2. 实现上下文选择逻辑
3. 修改后端以支持上下文选择

### 8.3 阶段三：高级功能和优化
1. 增加流式响应支持
2. 实现提问编辑和版本历史功能
3. 添加参数设置和预设管理
4. 优化多模型响应的并发处理
5. 添加响应比较工具
6. 支持不同的回答视图布局
7. 实现提问版本切换功能

## 9. 性能与可用性考虑

### 9.1 长会话处理

对于长对话历史，实施渐进式加载和虚拟滚动，确保界面响应迅速：

```mermaid
sequenceDiagram
    actor User as 用户
    participant UI as 聊天界面
    participant API as 后端API
    
    User->>UI: 打开长历史会话
    UI->>API: GET /api/conversations/{id}/turns?limit=20&offset=0
    API-->>UI: 返回最近20条轮次
    UI->>UI: 渲染最近的对话
    
    User->>UI: 向上滚动查看更早历史
    UI->>UI: 检测滚动到加载阈值
    UI->>API: GET /api/conversations/{id}/turns?limit=20&offset=20
    API-->>UI: 返回更早的20条轮次
    UI->>UI: 无缝渲染新加载的轮次
    UI->>UI: 移除不再显示的远期轮次
```

## 10. Agent整合准备

多模型对比聊天界面为后续Agent功能奠定了基础：

```mermaid
graph TD
    Chat[聊天系统] --> AgentLayer[Agent 层]
    
    subgraph "Agent层"
        AgentRouter[Agent路由器]
        ToolRegistry[工具注册表]
        Planner[规划器]
        Executor[执行器]
    end
    
    AgentLayer --> Models[模型层]
    
    AgentRouter --> ToolRegistry
    AgentRouter --> Planner
    Planner --> Executor
    Executor --> ToolRegistry
    
    ToolRegistry --> WebSearch[网页搜索]
    ToolRegistry --> Calculator[计算器]
    ToolRegistry --> CodeExecutor[代码执行器]
    ToolRegistry --> FileOps[文件操作]
    ToolRegistry --> ApiCaller[API调用]
```

Agent整合优势：

1. **参数优化** - 用户可以针对不同任务调整参数，找出最佳Agent配置
2. **会话修正** - 当Agent理解错误时，用户可以编辑提问澄清意图
3. **工具调用精确性** - 通过删除错误响应，确保Agent使用正确的上下文调用工具
4. **效果对比** - 比较不同参数设置对Agent工具使用的影响
5. **模型专长识别** - 根据比较结果为不同任务选择最适合的模型
6. **混合Agent设计** - 利用不同模型的优势构建复合Agent

## 11. 结论

这个多模型对比聊天界面设计提供了对话系统的完整解决方案，不仅支持基本的聊天功能，还具有以下高级特性：

1. 同时向多个模型提问并比较响应
2. 为每个对话轮次独立配置参数
3. 提问编辑与版本历史管理，可随时查看和切换历史版本
4. 选择特定模型回答作为上下文
5. 参数预设管理
6. 流式响应处理

这些功能共同确保用户可以维护高质量的对话历史，防止错误提问影响后续交互，同时通过参数微调充分发挥模型潜力。提问历史版本管理功能特别有助于用户比较不同提问方式对AI回答的影响，为用户提供更灵活的对话修改和实验能力。设计保持了用户友好性，同时为后续Agent功能扩展提供了灵活基础。