import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter
from slowapi.errors import RateLimitExceeded
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_db_query, cached_query
from app.core.config import settings
from app.core.database import get_db
from app.core.redis import redis_manager
from app.main import app
from app.api.limiter import custom_rate_limit_exceeded_handler, limiter


async def test_database_query_caching_5min_ttl():
    print("--- 1. Testing Generic Database Query Caching (5-Minute TTL) ---")
    
    # Mock Redis client using an in-memory dictionary to simulate Redis get/set/ex
    in_memory_redis = {}
    mock_redis = AsyncMock()

    async def mock_get(key):
        return in_memory_redis.get(key)

    async def mock_set(key, val, ex=None):
        in_memory_redis[key] = val
        assert ex == 300, f"Expected 300-second TTL (5 minutes), got: {ex}"
        return True

    mock_redis.get = mock_get
    mock_redis.set = mock_set

    with patch.object(redis_manager, "get_client", return_value=mock_redis):
        db_query_counter = 0

        async def simulated_heavy_database_query():
            nonlocal db_query_counter
            db_query_counter += 1
            return {
                "vessels_tracked": 4250,
                "coastal_zones_active": 18,
                "status": "ALL_RADARS_OPERATIONAL",
            }

        cache_key = "db_cache:maritime:test_traffic_summary"

        # 1st Call: Cache MISS -> Must execute heavy database query
        result1 = await cache_db_query(cache_key, simulated_heavy_database_query, ttl_seconds=300)
        assert db_query_counter == 1
        assert result1["vessels_tracked"] == 4250
        assert cache_key in in_memory_redis
        print(" [PASS] 1st request (Cache Miss): Executed query against DB and cached in Redis with 300s TTL.")

        # Simulate 1,000 subsequent requests from concurrent users
        for i in range(1000):
            result = await cache_db_query(cache_key, simulated_heavy_database_query, ttl_seconds=300)
            assert result["vessels_tracked"] == 4250

        # Verify DB query was NOT called again
        assert db_query_counter == 1
        print(" [PASS] 1,000 subsequent requests (Cache Hits): Served in-memory with 0 additional DB queries.")


def test_rate_limiting_auth_strict_and_global():
    print("\n--- 2. Testing Strict Auth Limiting (5/minute) & Global Limiting (100/minute) ---")
    
    # Switch limiter storage to local MemoryStorage for deterministic isolated test
    mem_storage = MemoryStorage()
    limiter._storage = mem_storage
    limiter._limiter = MovingWindowRateLimiter(mem_storage)

    # Mock get_db to prevent network connection attempts
    async def mock_get_db():
        mock_session = AsyncMock(spec=AsyncSession)
        mock_res = MagicMock()
        mock_res.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=mock_res)
        mock_session.commit = AsyncMock()
        yield mock_session

    app.dependency_overrides[get_db] = mock_get_db

    client = TestClient(app)

    # 1. Test strict limit on auth endpoints:
    # 5 allowed, 6th must return HTTP 429 Too Many Requests
    print(" Testing /api/v1/auth/login endpoint throttling (Max 5/minute)...")
    
    for req_num in range(1, 6):
        resp = client.post("/api/v1/auth/login", json={"email": f"test{req_num}@navy.gov.in", "password": "pass"})
        assert resp.status_code != 429, f"Request {req_num} was throttled prematurely"

    print(" [PASS] Requests 1 to 5 permitted through limiter.")

    # 6th request MUST be throttled with HTTP 429
    throttled_resp = client.post("/api/v1/auth/login", json={"email": "bot@attack.com", "password": "pass"})
    assert throttled_resp.status_code == 429
    data = throttled_resp.json()
    assert data["status"] == "error"
    assert data["error_code"] == "RATE_LIMIT_EXCEEDED"
    assert "Retry-After" in throttled_resp.headers
    print(f" [PASS] 6th request throttled with HTTP 429: {data['detail']}")

    # 2. Test global rate limit on general endpoints:
    print("\n Testing global IP rate limiting (100/minute)...")
    mem_storage.reset()
    for req_num in range(1, 101):
        resp = client.get("/")
        assert resp.status_code == 200, f"Request {req_num} failed"

    print(" [PASS] Requests 1 to 100 on / permitted through global limiter.")

    # 101st request throttled
    global_throttled = client.get("/")
    assert global_throttled.status_code == 429
    print(f" [PASS] 101st request throttled with HTTP 429.")

    app.dependency_overrides.clear()


if __name__ == "__main__":
    asyncio.run(test_database_query_caching_5min_ttl())
    test_rate_limiting_auth_strict_and_global()
