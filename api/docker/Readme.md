# Docker compose 部署

直接运行:
```bash
docker compose -f database.yaml up -d 
```

如果是测试数据库的话, 则对应的是:
```bash
docker compose -f database_test.yaml up -d 
```


# 使用Docker部署

在`docker` 目录中运行, 如果不是的话,需要按需调整对应的 volume.
```bash
docker run -d \
  --name my_agent_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=model_providers \
  -p 5432:5432 \
  -v "$(pwd)/../data/pgdata:/var/lib/postgresql/data" \
  --restart always \
  pgvector/pgvector:pg17

```

对于测试数据库, 则可以:
```bash
docker run -d \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=model_providers \
  -p 15432:5432 \
  pgvector/pgvector:pg17
```