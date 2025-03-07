# API 接口文档

本文档描述了模型提供商 API 的所有可用接口。

## 提供商（Provider）接口

### 获取所有提供商

```
GET /providers/
```

参数：
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
```json
[
  {
    "id": "uuid",
    "name": "提供商名称",
    "base_url": "https://api.provider.com",
    "description": "描述信息",
    "api_keys_count": 2  // API密钥的数量
  }
]
```

状态码：
- 200：提供商列表
- 500：服务器错误

### 获取特定提供商

```
GET /providers/{provider_id}
```

参数：
- `provider_id`: UUID，提供商 ID

响应：
```json
{
  "id": "uuid",
  "name": "提供商名称",
  "base_url": "https://api.provider.com",
  "description": "描述信息",
  "api_keys": [
    {
      "id": "uuid",
      "alias": "密钥别名",
      "key": "sk-xxx...xxx"  // 掩码处理后的密钥
    }
  ]
}
```

状态码：
- 200：提供商详细信息，包括掩码处理后的 API 密钥
- 404：提供商不存在
- 500：服务器错误

### 创建提供商

```
POST /providers/
```

请求体：
```json
{
  "name": "提供商名称",
  "base_url": "https://api.provider.com",
  "description": "可选描述",
  "initial_api_key": {  // 可选
    "alias": "初始密钥别名",
    "key": "sk-api-key-value"
  }
}
```

响应：
```json
{
  "id": "uuid",
  "name": "提供商名称",
  "base_url": "https://api.provider.com",
  "description": "可选描述",
  "api_keys": [
    {
      "id": "uuid",
      "alias": "初始密钥别名",
      "key": "sk-xxx...xxx"  // 掩码处理后的密钥
    }
  ]
}
```

状态码：
- 201：创建的提供商信息
- 409：提供商名称已存在
- 422：请求数据验证错误
- 500：服务器错误

### 更新提供商

```
PUT /providers/{provider_id}
```

请求体：
```json
{
  "name": "新的名称",
  "base_url": "https://new-api.provider.com", 
  "description": "新的描述"
}
```
所有字段均为可选，只更新提供的字段。

响应：
```json
{
  "id": "uuid",
  "name": "新的名称",
  "base_url": "https://new-api.provider.com",
  "description": "新的描述"
}
```

状态码：
- 200：更新后的提供商信息
- 404：提供商不存在
- 409：新名称与其他提供商冲突
- 422：请求数据验证错误
- 500：服务器错误

### 删除提供商

```
DELETE /providers/{provider_id}
```

响应：
- 204：删除成功，无内容返回
- 404：提供商不存在
- 500：服务器错误

## API 密钥接口

### 获取提供商的所有 API 密钥

```
GET /providers/{provider_id}/keys
```

参数：
- `provider_id`: UUID，提供商 ID
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
```json
[
  {
    "id": "uuid",
    "alias": "密钥别名",
    "key": "sk-xxx...xxx",  // 掩码处理后的密钥
    "provider_id": "uuid"
  }
]
```

状态码：
- 200：API 密钥列表（密钥值已掩码处理）
- 404：提供商不存在
- 500：服务器错误

### 为提供商创建 API 密钥

```
POST /providers/{provider_id}/keys
```

请求体：
```json
{
  "alias": "密钥别名",
  "key": "sk-api-key-value"
}
```

响应：
```json
{
  "id": "uuid",
  "alias": "密钥别名",
  "key": "sk-xxx...xxx",  // 掩码处理后的密钥
  "provider_id": "uuid"
}
```

状态码：
- 201：创建的 API 密钥信息（密钥值已掩码处理）
- 404：提供商不存在
- 422：请求数据验证错误
- 500：服务器错误

### 获取特定 API 密钥

```
GET /keys/{api_key_id}
```

参数：
- `api_key_id`: UUID，API 密钥 ID

响应：
```json
{
  "id": "uuid",
  "alias": "密钥别名",
  "key": "sk-xxx...xxx",  // 掩码处理后的密钥
  "provider_id": "uuid",
  "provider_name": "提供商名称"
}
```

状态码：
- 200：API 密钥信息（密钥值已掩码处理）
- 404：API 密钥不存在
- 500：服务器错误

### 更新 API 密钥

```
PUT /keys/{api_key_id}
```

请求体：
```json
{
  "alias": "新的别名",
  "key": "sk-new-key-value"
}
```
所有字段均为可选，只更新提供的字段。

响应：
```json
{
  "id": "uuid",
  "alias": "新的别名",
  "key": "sk-xxx...xxx",  // 掩码处理后的密钥
  "provider_id": "uuid"
}
```

状态码：
- 200：更新后的 API 密钥信息（密钥值已掩码处理）
- 404：API 密钥不存在
- 422：请求数据验证错误
- 500：服务器错误

### 删除 API 密钥

```
DELETE /keys/{api_key_id}
```

响应：
- 204：删除成功，无内容返回
- 404：API 密钥不存在
- 500：服务器错误

## 模型实现接口

### 获取所有模型实现

```
GET /models/
```

参数：
- `provider_id`: UUID，可选，按提供商过滤
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
```json
[
  {
    "id": "uuid",
    "model_id": "model-name",
    "provider_model_id": "provider-specific-id",
    "version": "1.0",
    "context_window": 16385,
    "pricing_info": {
      "input": 0.0001,
      "output": 0.0002,
      "currency": "USD",
      "unit": "1K tokens"
    },
    "is_available": true,
    "custom_parameters": {},
    "provider_id": "uuid",
    "provider_name": "提供商名称"
  }
]
```

状态码：
- 200：模型实现列表
- 500：服务器错误

### 获取特定模型实现

```
GET /models/{model_id}
```

参数：
- `model_id`: UUID，模型实现 ID

响应：
```json
{
  "id": "uuid",
  "model_id": "model-name",
  "provider_model_id": "provider-specific-id",
  "version": "1.0",
  "context_window": 16385,
  "pricing_info": {
    "input": 0.0001,
    "output": 0.0002,
    "currency": "USD",
    "unit": "1K tokens"
  },
  "is_available": true,
  "custom_parameters": {},
  "provider_id": "uuid",
  "provider_name": "提供商名称"
}
```

状态码：
- 200：模型实现详细信息
- 404：模型实现不存在
- 500：服务器错误

### 创建模型实现

```
POST /providers/{provider_id}/models
```

请求体：
```json
{
  "model_id": "model-name",
  "provider_model_id": "provider-specific-id",
  "version": "1.0",
  "context_window": 16385,
  "pricing_info": {
    "input": 0.0001,
    "output": 0.0002,
    "currency": "USD",
    "unit": "1K tokens"
  },
  "is_available": true,
  "custom_parameters": {}
}
```

响应：
```json
{
  "id": "uuid",
  "model_id": "model-name",
  "provider_model_id": "provider-specific-id",
  "version": "1.0",
  "context_window": 16385,
  "pricing_info": {
    "input": 0.0001,
    "output": 0.0002,
    "currency": "USD",
    "unit": "1K tokens"
  },
  "is_available": true,
  "custom_parameters": {},
  "provider_id": "uuid",
  "provider_name": "提供商名称"
}
```

状态码：
- 201：创建的模型实现信息
- 404：提供商不存在
- 409：相同提供商下已存在相同 model_id 的模型实现
- 422：请求数据验证错误
- 500：服务器错误

### 更新模型实现

```
PUT /models/{model_id}
```

请求体：
```json
{
  "provider_model_id": "new-provider-specific-id",
  "version": "2.0",
  "context_window": 32768,
  "pricing_info": {
    "input": 0.00015,
    "output": 0.00025,
    "currency": "USD",
    "unit": "1K tokens"
  },
  "is_available": true,
  "custom_parameters": {
    "temperature_default": 0.7
  }
}
```
所有字段均为可选，只更新提供的字段。

响应：
```json
{
  "id": "uuid",
  "model_id": "model-name",
  "provider_model_id": "new-provider-specific-id",
  "version": "2.0",
  "context_window": 32768,
  "pricing_info": {
    "input": 0.00015,
    "output": 0.00025,
    "currency": "USD",
    "unit": "1K tokens"
  },
  "is_available": true,
  "custom_parameters": {
    "temperature_default": 0.7
  },
  "provider_id": "uuid",
  "provider_name": "提供商名称"
}
```

状态码：
- 200：更新后的模型实现信息
- 404：模型实现不存在
- 422：请求数据验证错误
- 500：服务器错误

### 删除模型实现

```
DELETE /models/{model_id}
```

响应：
- 204：删除成功，无内容返回
- 404：模型实现不存在
- 500：服务器错误

## 对话（Conversation）接口

### 获取所有对话

```
GET /conversations/
```

参数：
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
```json
[
  {
    "id": "uuid",
    "title": "对话标题",
    "created_at": "2025-03-07T08:45:30.123456",
    "updated_at": "2025-03-07T09:15:45.678901",
    "user_id": "user-uuid",
    "system_prompt": "可选的系统提示"
  }
]
```

状态码：
- 200：对话列表
- 500：服务器错误

### 创建对话

```
POST /conversations/
```

请求体：
```json
{
  "title": "新对话标题",
  "system_prompt": "系统提示（可选）"
}
```

响应：
```json
{
  "id": "uuid",
  "title": "新对话标题",
  "created_at": "2025-03-07T08:45:30.123456",
  "updated_at": "2025-03-07T08:45:30.123456",
  "user_id": "user-uuid",
  "system_prompt": "系统提示"
}
```

状态码：
- 201：创建成功
- 422：请求数据验证错误
- 500：服务器错误

### 获取特定对话

```
GET /conversations/{conversation_id}
```

参数：
- `conversation_id`: UUID，对话ID

响应：
```json
{
  "id": "uuid",
  "title": "对话标题",
  "created_at": "2025-03-07T08:45:30.123456",
  "updated_at": "2025-03-07T09:15:45.678901",
  "user_id": "user-uuid",
  "system_prompt": "系统提示",
  "turns": [
    {
      "id": "turn-uuid",
      "user_input": "用户输入",
      "created_at": "2025-03-07T08:46:15.123456",
      "modified_at": "2025-03-07T08:46:15.123456",
      "active_response_id": "response-uuid",
      "is_deleted": false,
      "model_parameters": {
        "temperature": 0.7,
        "top_p": 1.0
      }
    }
  ]
}
```

状态码：
- 200：对话详情
- 404：对话不存在
- 500：服务器错误

### 更新对话

```
PUT /conversations/{conversation_id}
```

请求体：
```json
{
  "title": "更新的标题",
  "system_prompt": "更新的系统提示"
}
```

响应：
```json
{
  "id": "uuid",
  "title": "更新的标题",
  "created_at": "2025-03-07T08:45:30.123456",
  "updated_at": "2025-03-07T09:30:25.123456",
  "user_id": "user-uuid",
  "system_prompt": "更新的系统提示"
}
```

状态码：
- 200：更新的对话信息
- 404：对话不存在
- 422：请求数据验证错误
- 500：服务器错误

### 删除对话

```
DELETE /conversations/{conversation_id}
```

响应：
- 204：删除成功，无内容返回
- 404：对话不存在
- 500：服务器错误

### 获取参数预设

```
GET /conversations/parameter-presets
```

参数：
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
```json
[
  {
    "id": "preset-uuid",
    "name": "标准设置",
    "description": "适合一般对话的平衡设置",
    "parameters": {
      "temperature": 0.7,
      "top_p": 1.0,
      "max_tokens": 1000
    },
    "user_id": "user-uuid",
    "created_at": "2025-03-07T08:00:00.000000",
    "model_implementation_id": "model-impl-uuid"
  }
]
```

状态码：
- 200：参数预设列表
- 500：服务器错误

### 创建参数预设

```
POST /conversations/parameter-presets
```

请求体：
```json
{
  "name": "自定义设置",
  "description": "适合创意内容生成的设置",
  "parameters": {
    "temperature": 0.9,
    "top_p": 0.95,
    "max_tokens": 2000,
    "presence_penalty": 0.2,
    "frequency_penalty": 0.3,
    "model_specific_params": {
      "top_k": 40
    }
  },
  "model_implementation_id": "model-impl-uuid"
}
```

响应：
```json
{
  "id": "preset-uuid",
  "name": "自定义设置",
  "description": "适合创意内容生成的设置",
  "parameters": {
    "temperature": 0.9,
    "top_p": 0.95,
    "max_tokens": 2000,
    "presence_penalty": 0.2,
    "frequency_penalty": 0.3,
    "model_specific_params": {
      "top_k": 40
    }
  },
  "user_id": "user-uuid",
  "created_at": "2025-03-07T08:00:00.000000",
  "model_implementation_id": "model-impl-uuid"
}
```

状态码：
- 201：创建成功
- 422：请求数据验证错误
- 500：服务器错误

### 获取特定参数预设

```
GET /conversations/parameter-presets/{preset_id}
```

参数：
- `preset_id`: UUID，参数预设ID

响应：
```json
{
  "id": "preset-uuid",
  "name": "标准设置",
  "description": "适合一般对话的平衡设置",
  "parameters": {
    "temperature": 0.7,
    "top_p": 1.0,
    "max_tokens": 1000
  },
  "user_id": "user-uuid",
  "created_at": "2025-03-07T08:00:00.000000",
  "model_implementation_id": "model-impl-uuid"
}
```

状态码：
- 200：参数预设详情
- 404：参数预设不存在
- 500：服务器错误

### 更新参数预设

```
PUT /conversations/parameter-presets/{preset_id}
```

请求体：
```json
{
  "name": "更新的设置名称",
  "description": "更新的描述",
  "parameters": {
    "temperature": 0.8,
    "top_p": 0.9,
    "max_tokens": 1500
  }
}
```

响应：
```json
{
  "id": "preset-uuid",
  "name": "更新的设置名称",
  "description": "更新的描述",
  "parameters": {
    "temperature": 0.8,
    "top_p": 0.9,
    "max_tokens": 1500
  },
  "user_id": "user-uuid",
  "created_at": "2025-03-07T08:00:00.000000",
  "model_implementation_id": "model-impl-uuid"
}
```

状态码：
- 200：更新的参数预设信息
- 404：参数预设不存在
- 422：请求数据验证错误
- 500：服务器错误

### 删除参数预设

```
DELETE /conversations/parameter-presets/{preset_id}
```

响应：
- 204：删除成功，无内容返回
- 404：参数预设不存在
- 500：服务器错误

## 对话轮次（Conversation Turn）接口

### 获取对话的所有轮次

```
GET /conversations/{conversation_id}/turns
```

参数：
- `conversation_id`: UUID，对话ID
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
```json
[
  {
    "id": "turn-uuid",
    "user_input": "用户输入",
    "created_at": "2025-03-07T08:46:15.123456",
    "modified_at": "2025-03-07T08:46:15.123456",
    "conversation_id": "conversation-uuid",
    "active_response_id": "response-uuid",
    "is_deleted": false,
    "model_parameters": {
      "temperature": 0.7,
      "top_p": 1.0
    }
  }
]
```

状态码：
- 200：对话轮次列表
- 404：对话不存在
- 500：服务器错误

### 创建对话轮次

```
POST /conversations/{conversation_id}/turns
```

参数：
- `conversation_id`: UUID，对话ID

请求体：
```json
{
  "user_input": "用户输入的问题或指令",
  "model_parameters": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

响应：
```json
{
  "id": "turn-uuid",
  "user_input": "用户输入的问题或指令",
  "created_at": "2025-03-07T08:46:15.123456",
  "modified_at": "2025-03-07T08:46:15.123456",
  "conversation_id": "conversation-uuid",
  "active_response_id": null,
  "is_deleted": false,
  "model_parameters": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

状态码：
- 201：创建成功
- 404：对话不存在
- 422：请求数据验证错误
- 500：服务器错误

### 获取特定对话轮次

```
GET /conversations/{conversation_id}/turns/{turn_id}
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID

响应：
```json
{
  "id": "turn-uuid",
  "user_input": "用户输入的问题或指令",
  "created_at": "2025-03-07T08:46:15.123456",
  "modified_at": "2025-03-07T08:46:15.123456",
  "conversation_id": "conversation-uuid",
  "active_response_id": "response-uuid",
  "is_deleted": false,
  "model_parameters": {
    "temperature": 0.7,
    "top_p": 0.9
  },
  "responses": [
    {
      "id": "response-uuid",
      "content": "模型的响应内容",
      "created_at": "2025-03-07T08:46:20.123456",
      "model_implementation_id": "model-impl-uuid",
      "is_selected": true,
      "is_deleted": false,
      "response_metadata": {
        "finish_reason": "stop",
        "tokens": {
          "prompt": 50,
          "completion": 150,
          "total": 200
        }
      },
      "input_version_id": "version-uuid"
    }
  ],
  "input_versions": [
    {
      "id": "version-uuid",
      "content": "用户输入的问题或指令",
      "created_at": "2025-03-07T08:46:15.123456",
      "is_current": true,
      "model_parameters": {
        "temperature": 0.7,
        "top_p": 0.9
      }
    }
  ]
}
```

状态码：
- 200：对话轮次详情，包括响应和输入版本
- 404：对话或对话轮次不存在
- 500：服务器错误

### 更新对话轮次

```
PUT /conversations/{conversation_id}/turns/{turn_id}
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID

请求体：
```json
{
  "user_input": "更新后的用户输入",
  "model_parameters": {
    "temperature": 0.8,
    "top_p": 0.85
  }
}
```

响应：
```json
{
  "id": "turn-uuid",
  "user_input": "更新后的用户输入",
  "created_at": "2025-03-07T08:46:15.123456",
  "modified_at": "2025-03-07T08:50:25.123456",
  "conversation_id": "conversation-uuid",
  "active_response_id": "response-uuid",
  "is_deleted": false,
  "model_parameters": {
    "temperature": 0.8,
    "top_p": 0.85
  }
}
```

状态码：
- 200：更新的对话轮次信息
- 404：对话或对话轮次不存在
- 422：请求数据验证错误
- 500：服务器错误

### 删除对话轮次（软删除）

```
DELETE /conversations/{conversation_id}/turns/{turn_id}
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID

响应：
```json
{
  "id": "turn-uuid",
  "user_input": "用户输入的问题或指令",
  "created_at": "2025-03-07T08:46:15.123456",
  "modified_at": "2025-03-07T08:55:10.123456",
  "conversation_id": "conversation-uuid",
  "active_response_id": "response-uuid",
  "is_deleted": true,
  "model_parameters": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

状态码：
- 200：软删除后的对话轮次信息
- 404：对话或对话轮次不存在
- 500：服务器错误

## 用户输入版本（User Input Version）接口

### 获取对话轮次的所有输入版本

```
GET /conversations/{conversation_id}/turns/{turn_id}/versions
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID

响应：
```json
[
  {
    "id": "version-uuid",
    "content": "原始用户输入",
    "created_at": "2025-03-07T08:46:15.123456",
    "turn_id": "turn-uuid",
    "is_current": false,
    "model_parameters": {
      "temperature": 0.7,
      "top_p": 0.9
    }
  },
  {
    "id": "version-uuid-2",
    "content": "编辑后的用户输入",
    "created_at": "2025-03-07T08:50:25.123456",
    "turn_id": "turn-uuid",
    "is_current": true,
    "model_parameters": {
      "temperature": 0.8,
      "top_p": 0.85
    }
  }
]
```

状态码：
- 200：用户输入版本列表
- 404：对话或对话轮次不存在
- 500：服务器错误

### 创建用户输入版本

```
POST /conversations/{conversation_id}/turns/{turn_id}/versions
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID

请求体：
```json
{
  "content": "编辑后的用户输入",
  "model_parameters": {
    "temperature": 0.8,
    "top_p": 0.85
  }
}
```

响应：
```json
{
  "id": "version-uuid",
  "content": "编辑后的用户输入",
  "created_at": "2025-03-07T08:50:25.123456",
  "turn_id": "turn-uuid",
  "is_current": true,
  "model_parameters": {
    "temperature": 0.8,
    "top_p": 0.85
  }
}
```

状态码：
- 201：创建成功
- 404：对话或对话轮次不存在
- 422：请求数据验证错误
- 500：服务器错误

### 获取特定用户输入版本

```
GET /conversations/{conversation_id}/turns/{turn_id}/versions/{version_id}
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID
- `version_id`: UUID，用户输入版本ID

响应：
```json
{
  "id": "version-uuid",
  "content": "编辑后的用户输入",
  "created_at": "2025-03-07T08:50:25.123456",
  "turn_id": "turn-uuid",
  "is_current": true,
  "model_parameters": {
    "temperature": 0.8,
    "top_p": 0.85
  }
}
```

状态码：
- 200：用户输入版本详情
- 404：对话、对话轮次或版本不存在
- 500：服务器错误

### 设置当前版本

```
PUT /conversations/{conversation_id}/turns/{turn_id}/versions/{version_id}/set-current
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID
- `version_id`: UUID，用户输入版本ID

响应：
```json
{
  "id": "version-uuid",
  "content": "之前的用户输入",
  "created_at": "2025-03-07T08:48:30.123456",
  "turn_id": "turn-uuid",
  "is_current": true,
  "model_parameters": {
    "temperature": 0.7,
    "top_p": 0.9
  }
}
```

状态码：
- 200：设置为当前版本后的信息
- 404：对话、对话轮次或版本不存在
- 500：服务器错误

## 模型响应（Model Response）接口

### 创建模型响应

```
POST /conversations/{conversation_id}/turns/{turn_id}/responses
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID

请求体：
```json
{
  "model_implementation_id": "model-impl-uuid",
  "content": "模型生成的响应内容",
  "is_selected": false,
  "response_metadata": {
    "finish_reason": "stop",
    "tokens": {
      "prompt": 50,
      "completion": 150,
      "total": 200
    }
  },
  "input_version_id": "version-uuid"
}
```

响应：
```json
{
  "id": "response-uuid",
  "model_implementation_id": "model-impl-uuid",
  "content": "模型生成的响应内容",
  "created_at": "2025-03-07T08:50:35.123456",
  "turn_id": "turn-uuid",
  "is_selected": false,
  "is_deleted": false,
  "response_metadata": {
    "finish_reason": "stop",
    "tokens": {
      "prompt": 50,
      "completion": 150,
      "total": 200
    }
  },
  "input_version_id": "version-uuid"
}
```

状态码：
- 201：创建成功
- 404：对话或对话轮次不存在
- 422：请求数据验证错误
- 500：服务器错误

### 选择模型响应作为上下文

```
PUT /conversations/{conversation_id}/turns/{turn_id}/responses/{response_id}/select
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID
- `response_id`: UUID，模型响应ID

响应：
```json
{
  "id": "response-uuid",
  "model_implementation_id": "model-impl-uuid",
  "content": "模型生成的响应内容",
  "created_at": "2025-03-07T08:50:35.123456",
  "turn_id": "turn-uuid",
  "is_selected": true,
  "is_deleted": false,
  "response_metadata": {
    "finish_reason": "stop",
    "tokens": {
      "prompt": 50,
      "completion": 150,
      "total": 200
    }
  },
  "input_version_id": "version-uuid"
}
```

状态码：
- 200：设置为选中响应后的信息
- 404：对话、对话轮次或响应不存在
- 500：服务器错误

### 删除模型响应（软删除）

```
DELETE /conversations/{conversation_id}/turns/{turn_id}/responses/{response_id}
```

参数：
- `conversation_id`: UUID，对话ID
- `turn_id`: UUID，对话轮次ID
- `response_id`: UUID，模型响应ID

响应：
```json
{
  "id": "response-uuid",
  "model_implementation_id": "model-impl-uuid",
  "content": "模型生成的响应内容",
  "created_at": "2025-03-07T08:50:35.123456",
  "turn_id": "turn-uuid",
  "is_selected": true,
  "is_deleted": true,
  "response_metadata": {
    "finish_reason": "stop",
    "tokens": {
      "prompt": 50,
      "completion": 150,
      "total": 200
    }
  },
  "input_version_id": "version-uuid"
}
```

状态码：
- 200：软删除后的模型响应信息
- 404：对话、对话轮次或响应不存在
- 500：服务器错误