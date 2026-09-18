from typing import Optional
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_ignore_empty=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "Samundra Drishti Core API"
    ENVIRONMENT: str = "development"
    DB_ECHO: bool = False

    # Connection pooling target:
    # Under PgBouncer transaction pooling mode, port is 6432.
    # For direct PostgreSQL connection, port is 5432.
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 6432
    POSTGRES_DB: str = "samundra_drishti"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"

    # JWT & Session Security
    JWT_SECRET_KEY: str = "super_secret_government_grade_key_samundra_drishti_2026_min_256_bits_security"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Cookie Hardening
    COOKIE_NAME: str = "samundra_access_token"
    COOKIE_SECURE: bool = False  # Set to True in production (HTTPS enforced)
    COOKIE_SAMESITE: str = "strict"

    # Brute-force & Security Lockout Policies (NIST SP 800-63B)
    MAX_LOGIN_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15

    # Redis Scaling & Caching (1M Concurrent Scale)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: Optional[str] = None
    REDIS_DB: int = 0
    REDIS_MAX_CONNECTIONS: int = 500
    REDIS_CACHE_TTL_SECONDS: int = 300  # 5-minute Time-To-Live for database caching

    # Rate Limiting Policies
    GLOBAL_RATE_LIMIT: str = "100/minute"  # 100 requests per minute per IP address
    AUTH_RATE_LIMIT: str = "5/minute"      # 5 requests per minute for login/register

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    @computed_field
    @property
    def REDIS_URL(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


settings = Settings()
