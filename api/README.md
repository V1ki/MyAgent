# Model Provider API

模型提供商（Model Provider）API 是一个基于 FastAPI 和 PostgreSQL + pgvector 构建的服务，用于管理不同的模型提供商、API 密钥以及模型实现。

## 目录结构

```
api/
├── app/
│   ├── db/              # 数据库连接和配置
│   ├── models/          # 数据模型（SQLAlchemy ORM 和 Pydantic 架构）
│   ├── routers/         # API 路由/接口定义
│   ├── services/        # 业务逻辑层
│   └── tests/           # 自动化测试
├── docker/             # Docker 配置文件
│   └── database.yaml   # PostgreSQL + pgvector 容器配置
├── data/               # 数据存储（PostgreSQL 数据）
└── requirements.txt    # 依赖包列表
```

## 类结构

以下是系统的核心数据模型和服务的类结构图。

```mermaid
classDiagram
    class ModelProvider {
        +UUID id
        +String name
        +String base_url
        +String description
        +List[ApiKey] api_keys
        +List[ModelImplementation] model_implementations
    }
    
    class ApiKey {
        +UUID id
        +UUID provider_id
        +String alias
        +String key
        +ModelProvider provider
    }
    
    class ModelImplementation {
        +UUID id
        +UUID provider_id
        +String model_id
        +String provider_model_id
        +String version
        +Integer context_window
        +JSON pricing_info
        +Boolean is_available
        +JSON custom_parameters
        +ModelProvider provider
    }
    
    ModelProvider "1" --> "*" ApiKey : has
    ModelProvider "1" --> "*" ModelImplementation : has
```

## 服务层结构

```mermaid
classDiagram
    class ProviderService {
        +get_providers(db, skip, limit) List[ModelProvider]
        +get_provider(db, provider_id) ModelProvider
        +get_provider_by_name(db, name) ModelProvider
        +create_provider(db, provider) ModelProvider
        +update_provider(db, provider_id, provider) ModelProvider
        +delete_provider(db, provider_id) bool
    }
    
    class ApiKeyService {
        +get_api_keys(db, provider_id, skip, limit) List[ApiKey]
        +get_api_key(db, api_key_id) ApiKey
        +create_api_key(db, provider_id, api_key) ApiKey
        +update_api_key(db, api_key_id, api_key) ApiKey
        +delete_api_key(db, api_key_id) bool
        +mask_api_key(key) String
    }
```

## API 流程

以下流程图展示了 API 的主要操作流程。

### 创建模型提供商流程

```mermaid
sequenceDiagram
    Client->>+API: POST /providers/
    API->>+Database: 检查提供商名称是否存在
    Database-->>-API: 返回结果
    alt 名称已存在
        API-->>Client: 409 Conflict
    else 名称不存在
        API->>+Database: 创建新提供商
        Database-->>-API: 返回新提供商信息
        opt 包含初始 API 密钥
            API->>+Database: 创建 API 密钥
            Database-->>-API: 返回 API 密钥信息
        end
        API-->>-Client: 201 Created
    end
```

### 获取提供商 API 密钥流程

```mermaid
sequenceDiagram
    Client->>+API: GET /providers/{id}/keys
    API->>+Database: 验证提供商是否存在
    Database-->>-API: 返回结果
    alt 提供商不存在
        API-->>Client: 404 Not Found
    else 提供商存在
        API->>+Database: 获取该提供商的 API 密钥
        Database-->>-API: 返回 API 密钥列表
        API->>API: 为每个密钥生成掩码预览
        API-->>-Client: 200 OK 带掩码的密钥列表
    end
```

## API 接口文档

### 提供商（Provider）接口

#### 获取所有提供商

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

#### 获取特定提供商

```
GET /providers/{provider_id}
```

参数：
- `provider_id`: UUID，提供商 ID

响应：
- 200：提供商详细信息，包括掩码处理后的 API 密钥
- 404：提供商不存在
- 500：服务器错误

#### 创建提供商

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
- 201：创建的提供商信息
- 409：提供商名称已存在
- 422：请求数据验证错误
- 500：服务器错误

#### 更新提供商

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
- 200：更新后的提供商信息
- 404：提供商不存在
- 409：新名称与其他提供商冲突
- 422：请求数据验证错误
- 500：服务器错误

#### 删除提供商

```
DELETE /providers/{provider_id}
```

响应：
- 204：删除成功，无内容返回
- 404：提供商不存在
- 500：服务器错误

### API 密钥接口

#### 获取提供商的所有 API 密钥

```
GET /providers/{provider_id}/keys
```

参数：
- `provider_id`: UUID，提供商 ID
- `skip`: 整数，用于分页，默认为 0
- `limit`: 整数，每页数量，默认为 100，最大为 100

响应：
- 200：API 密钥列表（密钥值已掩码处理）
- 404：提供商不存在
- 500：服务器错误

#### 为提供商创建 API 密钥

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
- 201：创建的 API 密钥信息（密钥值已掩码处理）
- 404：提供商不存在
- 422：请求数据验证错误
- 500：服务器错误

#### 获取特定 API 密钥

```
GET /keys/{api_key_id}
```

参数：
- `api_key_id`: UUID，API 密钥 ID

响应：
- 200：API 密钥信息（密钥值已掩码处理）
- 404：API 密钥不存在
- 500：服务器错误

#### 更新 API 密钥

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
- 200：更新后的 API 密钥信息（密钥值已掩码处理）
- 404：API 密钥不存在
- 422：请求数据验证错误
- 500：服务器错误

#### 删除 API 密钥

```
DELETE /keys/{api_key_id}
```

响应：
- 204：删除成功，无内容返回
- 404：API 密钥不存在
- 500：服务器错误

## 使用方法

### 必要条件

- Docker和Docker Compose（运行PostgreSQL+pgvector数据库）
- Python 3.10+

### 安装

1. 克隆此仓库

2. 安装依赖
```bash
cd api
pip install -r requirements.txt
```

3. 启动PostgreSQL+pgvector数据库
```bash
cd api
docker-compose -f docker/database.yaml up -d
```

4. 运行API服务
```bash
cd api
uvicorn app.main:app --reload
```

API将在 http://localhost:8000 启动，可以通过 http://localhost:8000/docs 访问交互式API文档。

### 自动化测试

运行自动化测试套件:

```bash
cd api
pytest
```

这将运行所有测试并显示测试结果。

## 环境变量

通过`.env`文件或环境变量设置以下配置:

- `DATABASE_URL`: PostgreSQL连接字符串(默认: `postgresql://postgres:postgres@localhost:5432/model_providers`)

## 开发

### 数据库迁移

使用Alembic进行数据库迁移（首次使用需要初始化）:

```bash
# 初始化Alembic（如果尚未初始化）
alembic init migrations

# 创建新的迁移版本
alembic revision --autogenerate -m "描述迁移内容"

# 应用迁移
alembic upgrade head
```