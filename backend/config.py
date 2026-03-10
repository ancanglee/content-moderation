from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # AWS 配置
    aws_region: str = "us-east-1"
    s3_temp_bucket: str = "content-moderation-temp"

    # Bedrock 模型 (使用跨区域推理配置文件 ID)
    policy_model_id: str = "us.amazon.nova-pro-v1:0"
    moderation_model_id: str = "us.amazon.nova-premier-v1:0"

    # 数据库
    database_url: str = "sqlite+aiosqlite:///./moderation.db"

    # 批量处理
    batch_concurrency: int = 5

    # 服务器
    host: str = "0.0.0.0"
    port: int = 8001

    model_config = {"env_prefix": "CM_", "env_file": ".env"}


settings = Settings()
