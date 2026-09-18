from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.limiter import custom_rate_limit_exceeded_handler, limiter
from app.api.v1 import api_v1_router
from app.core.config import settings
from app.core.redis import redis_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Redis connection pool
    await redis_manager.init_redis()
    yield
    # Shutdown: Clean up engine & Redis pool
    from app.core.database import engine
    await engine.dispose()
    await redis_manager.close()


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="High-security backend engine for the Samundra Drishti Maritime Platform",
        version="1.0.0",
        lifespan=lifespan,
    )

    # Attach distributed SlowAPI rate limiter
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, custom_rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)

    # Security: Strict CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
    )

    app.include_router(api_v1_router, prefix="/api")

    @app.get("/", tags=["Root"])
    async def root():
        return {
            "name": settings.PROJECT_NAME,
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
            "rate_limiting": {
                "global": settings.GLOBAL_RATE_LIMIT,
                "auth": settings.AUTH_RATE_LIMIT,
            },
        }

    return app


app = create_application()
