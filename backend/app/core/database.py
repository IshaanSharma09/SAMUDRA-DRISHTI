from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings

# MASSIVE SCALE REQUIREMENT FOR PGBOUNCER (TRANSACTION MODE):
# 1. poolclass=NullPool:
#    Disables client-side connection pooling inside SQLAlchemy.
#    All pooling is delegated to PgBouncer to prevent duplicate connection pooling layers
#    and connection starvation at scale.
# 2. statement_cache_size=0 and prepared_statement_cache_size=0:
#    Disables asyncpg's internal statement caching. In PgBouncer transaction mode,
#    individual queries in subsequent transactions may run on different backend
#    Postgres connections, so caching named prepared statements leads to
#    "prepared statement does not exist" or DuplicatePreparedStatementError.
engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=settings.DB_ECHO,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
