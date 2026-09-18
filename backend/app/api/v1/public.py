from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.cache import cache_db_query, cached_query
from app.core.database import get_db

router = APIRouter()


@router.get("/vessel-telemetry-summary")
async def get_vessel_telemetry_summary(db: AsyncSession = Depends(get_db)):
    """
    Public Maritime Intelligence Telemetry Endpoint:
    - Cached in Redis with a 5-Minute Time-To-Live (300 seconds).
    - If 1,000,000 users query this endpoint simultaneously, only the 1st request
      touches PostgreSQL. The subsequent 999,999 requests are served directly from Redis RAM.
    """
    async def fetch_from_database():
        # Generic query simulating database aggregation of maritime traffic
        query = text("""
            SELECT 
                COUNT(*) as total_users,
                'INDIAN_OCEAN_SURVEILLANCE_GRID' as zone,
                NOW() as db_queried_at
            FROM users
        """)
        result = await db.execute(query)
        row = result.mappings().first()
        return {
            "monitored_zone": "INDIAN_OCEAN_MARITIME_DOMAIN",
            "active_surveillance_sectors": 14,
            "registered_personnel_count": row["total_users"] if row else 0,
            "telemetry_source": "PostgreSQL via PgBouncer (Fresh Query)",
            "cached_at": datetime.now(timezone.utc).isoformat(),
            "expires_in_seconds": 300,
        }

    # Intercept with Redis caching utility (5-min TTL)
    data = await cache_db_query(
        cache_key="db_cache:maritime:vessel_telemetry_summary",
        fetch_func=fetch_from_database,
        ttl_seconds=300,
    )
    return data


@router.get("/coastal-bulletin")
@cached_query(key_prefix="coastal_bulletin", ttl_seconds=300)
async def get_coastal_bulletin(zone: str = "bay_of_bengal"):
    """Cached generic query endpoint demonstrating the @cached_query decorator."""
    return {
        "zone": zone,
        "sea_state": "Normal",
        "advisory_level": "Code Green",
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "ttl": "300 seconds",
    }
