from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter()


@router.get("/live", status_code=status.HTTP_200_OK)
async def liveness_probe():
    """Liveness probe to check if the application process is running."""
    return {"status": "ok", "service": "samundra-drishti-backend"}


@router.get("/ready", status_code=status.HTTP_200_OK)
async def readiness_probe(db: AsyncSession = Depends(get_db)):
    """Readiness probe that executes a lightweight query (SELECT 1) through the connection pooler."""
    try:
        result = await db.execute(text("SELECT 1"))
        row = result.scalar()
        if row != 1:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database query returned unexpected result",
            )
        return {
            "status": "ready",
            "database": "connected",
            "mode": "pgbouncer_transaction_pool",
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity check failed: {str(exc)}",
        ) from exc
