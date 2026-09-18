from fastapi import Request, Response
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from app.core.config import settings


def get_real_client_ip(request: Request) -> str:
    """
    Extract real client IP address.
    Checks X-Forwarded-For if behind trusted reverse proxies (Cloudflare, Nginx, AWS ALB),
    falling back to direct client host to prevent IP spoofing attacks.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # First IP in the comma-separated chain is the client IP
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


# Configure distributed Redis-backed rate limiter with automatic in-memory fallback
limiter = Limiter(
    key_func=get_real_client_ip,
    storage_uri=settings.REDIS_URL,
    default_limits=[settings.GLOBAL_RATE_LIMIT],  # 100 requests per minute globally
    in_memory_fallback_enabled=True,              # Resiliency: If Redis experiences network partition, fall back to memory
    swallow_errors=True,
)


def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """Standardized JSON response for throttled requests."""
    return JSONResponse(
        status_code=429,
        content={
            "status": "error",
            "error_code": "RATE_LIMIT_EXCEEDED",
            "detail": f"Rate limit threshold exceeded: {exc.detail}. Automated bot defense active.",
        },
        headers={"Retry-After": "60"},
    )
