from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.health import router as health_router
from app.api.v1.public import router as public_router

api_v1_router = APIRouter(prefix="/v1")
api_v1_router.include_router(health_router, prefix="/health", tags=["Health & System Telemetry"])
api_v1_router.include_router(auth_router, prefix="/auth", tags=["Government Authentication"])
api_v1_router.include_router(public_router, prefix="/public", tags=["Cached Public Intelligence"])
