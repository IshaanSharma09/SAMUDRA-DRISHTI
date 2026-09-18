from datetime import datetime, timedelta, timezone
import math
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.limiter import limiter
from app.core.config import settings
from app.core.database import get_db
from app.core.security import DUMMY_HASH, create_access_token, get_password_hash, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserRead

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def register_user(
    request: Request,
    payload: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """Register a new user with bcrypt password hashing."""
    query = select(User).where(User.email == payload.email.lower())
    result = await db.execute(query)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists.",
        )

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password must be at least 8 characters in length.",
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=get_password_hash(payload.password),
        role=UserRole.VIEWER,
        failed_login_attempts=0,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login")
@limiter.limit(settings.AUTH_RATE_LIMIT)
async def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate user credentials, enforce 5-strike 15-minute brute-force lockout,
    and issue JWT strictly inside an HTTP-only, Secure, SameSite=Strict cookie.
    CRITICAL: NO token is returned in the response body to prevent JavaScript/XSS exfiltration.
    """
    query = select(User).where(User.email == payload.email.lower())
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    now = datetime.now(timezone.utc)

    # Mitigate account enumeration by running dummy verify on nonexistent users
    if not user:
        verify_password("dummy_password", DUMMY_HASH)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # 1. Enforce active lockout
    if user.account_locked_until and user.account_locked_until > now:
        remaining_seconds = math.ceil((user.account_locked_until - now).total_seconds())
        remaining_minutes = math.ceil(remaining_seconds / 60)
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=f"Account is temporarily locked due to excessive failed attempts. Please try again in {remaining_minutes} minute(s).",
            headers={"Retry-After": str(remaining_seconds)},
        )

    # 2. Verify password with bcrypt
    is_valid = verify_password(payload.password, user.hashed_password)

    if not is_valid:
        user.failed_login_attempts += 1

        # 5-strike rule: lock account for 15 minutes
        if user.failed_login_attempts >= settings.MAX_LOGIN_ATTEMPTS:
            user.account_locked_until = now + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES)
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Maximum login attempts exceeded ({settings.MAX_LOGIN_ATTEMPTS}). Account locked for {settings.LOCKOUT_DURATION_MINUTES} minutes.",
                headers={"Retry-After": str(settings.LOCKOUT_DURATION_MINUTES * 60)},
            )

        await db.commit()
        remaining = settings.MAX_LOGIN_ATTEMPTS - user.failed_login_attempts
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid email or password. {remaining} attempt(s) remaining before lockout.",
        )

    # 3. Authentication successful: reset failed attempts & locks
    user.failed_login_attempts = 0
    user.account_locked_until = None
    await db.commit()

    # 4. Generate signed JWT
    token = create_access_token(subject=str(user.id), role=user.role.value)

    # 5. Set strict HTTP-Only, Secure, SameSite=Strict cookie
    max_age_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        max_age=max_age_seconds,
        expires=max_age_seconds,
        httponly=True,                  # PROHIBITS JAVASCRIPT / XSS ACCESS
        secure=settings.COOKIE_SECURE,  # ENFORCES HTTPS IN PRODUCTION
        samesite=settings.COOKIE_SAMESITE,  # STRICT MITIGATES CSRF
        path="/",
    )

    # 6. Response body MUST NOT contain the token (Zero-Trust XSS Defense)
    return {
        "status": "success",
        "message": "Authentication successful. Secure session initialized.",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "role": user.role.value,
        },
    }


@router.post("/logout")
async def logout(response: Response):
    """Clear authentication session cookie."""
    response.delete_cookie(
        key=settings.COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    return {"status": "success", "message": "Session terminated successfully."}


@router.get("/me", response_model=UserRead)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Retrieve currently authenticated user identity from HTTP-only session."""
    return current_user
