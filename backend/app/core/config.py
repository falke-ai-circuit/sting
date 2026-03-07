from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    app_name: str = "STING 2.0"
    api_prefix: str = "/api/v1"
    debug: bool = False

    # Database
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "sting"
    db_user: str = "sting"
    db_password: str = "sting123"

    # Redis
    redis_host: str = "10.10.10.104"
    redis_port: int = 6379
    redis_db: int = 0

    # Proxy
    ssh_proxy_port: int = 2222
    ssh_upstream_host: str = "10.10.10.100"
    ssh_upstream_port: int = 2222

    # API
    api_port: int = 8700
    frontend_port: int = 8701

    # Verdict
    hostile_threshold: int = 30  # score >= 30 = trap mode

    @property
    def db_dsn(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    @property
    def db_dsn_async(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"

    class Config:
        env_prefix = "STING_"
        env_file = ".env"

settings = Settings()
