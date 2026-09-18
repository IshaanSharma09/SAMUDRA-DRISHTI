from typing import Optional
import redis.asyncio as aioredis
from app.core.config import settings


class RedisManager:
    """Enterprise asynchronous connection manager for Redis."""

    def __init__(self):
        self.pool: Optional[aioredis.ConnectionPool] = None
        self.client: Optional[aioredis.Redis] = None

    async def init_redis(self) -> None:
        """Initialize high-concurrency async connection pool."""
        try:
            self.pool = aioredis.ConnectionPool.from_url(
                settings.REDIS_URL,
                max_connections=settings.REDIS_MAX_CONNECTIONS,
                decode_responses=True,
                socket_timeout=2.0,
                socket_connect_timeout=2.0,
                retry_on_timeout=True,
            )
            self.client = aioredis.Redis(connection_pool=self.pool)
        except Exception as exc:
            print(f"[REDIS POOL INITIALIZATION FAILED] {exc}")

    async def get_client(self) -> aioredis.Redis:
        """Retrieve or initialize the active Redis client."""
        if self.client is None:
            await self.init_redis()
        return self.client

    async def ping(self) -> bool:
        """Check Redis connectivity."""
        try:
            client = await self.get_client()
            return await client.ping()
        except Exception:
            return False

    async def close(self) -> None:
        """Gracefully close and drain Redis connections."""
        if self.client:
            await self.client.aclose()
        if self.pool:
            await self.pool.disconnect()


redis_manager = RedisManager()


async def get_redis() -> aioredis.Redis:
    """FastAPI dependency for accessing the Redis client."""
    return await redis_manager.get_client()
