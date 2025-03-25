# Model Provider API

模型提供商（Model Provider）API 是一个基于 FastAPI 和 PostgreSQL + pgvector 构建的服务，用于管理不同的模型提供商、API 密钥以及模型实现。

## 免费额度
免费额度有如下几种类型 
1. 每个模型提供商为每个用户提供一定量的赠送金额. 
2. 每个模型提供商为每个用户提供一定量的 赠送Token 数, 这个 Token数是所有的模型共享的.
3. 每个模型提供商为每个用户下的每个模型提供一定量的赠送Token数, 这个 Token数不是共享的.

其次, 每个模型提供商只会使用一种免费额度的类型, APIKey 可以看成一个用户, 不需要考虑一个用户下有多个 APIKey 的情况.

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
├── docs/               # 文档
│   └── api.md          # API 接口文档
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

有关详细的 API 接口文档，请参阅 [API 接口文档](docs/api.md)

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