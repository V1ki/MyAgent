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