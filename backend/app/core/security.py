from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import jwt
from passlib.context import CryptContext

from app.core.config import settings

# Strict bcrypt configuration via passlib
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # Industry standard work factor for government-grade assurance
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Securely verify password using constant-time string comparison in bcrypt."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate salted bcrypt hash."""
    return pwd_context.hash(password)


# Pre-computed dummy hash to ensure constant-time response against account enumeration attacks
DUMMY_HASH = get_password_hash("government_defense_constant_time_dummy")


def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Mint signed JWT with subject, role, and standard claims."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: dict[str, Any] = {
        "sub": str(subject),
        "role": str(role),
        "iat": now,
        "nbf": now,
        "exp": expire,
        "iss": "samundra-drishti-core",
    }
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    """Verify cryptographic signature and decode JWT payload."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer="samundra-drishti-core",
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None
