import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter

from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.models.user import User, UserRole
from app.core.config import settings
from app.main import app
from app.core.database import get_db
from app.api.limiter import limiter

def test_security_core():
    print("--- 1. Testing Bcrypt Password Hashing & Verification ---")
    password = "SuperSecretSecurePassword!2026"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword123", hashed) is False
    print(" [PASS] Bcrypt hashing & verification succeeded.")

    print("\n--- 2. Testing JWT Minting & Claims Decoding ---")
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    token = create_access_token(subject=user_id, role="super_admin")
    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == user_id
    assert decoded["role"] == "super_admin"
    assert decoded["iss"] == "samundra-drishti-core"
    assert "exp" in decoded
    print(" [PASS] JWT claims, signature, and expiration verified.")

def test_api_auth_cookie_and_lockout():
    print("\n--- 3. Testing Authentication Endpoints & HTTP-Only Cookie Session ---")
    
    # Use memory storage and reset between tests so rate limit doesn't mask lockout verification
    mem_storage = MemoryStorage()
    limiter._storage = mem_storage
    limiter._limiter = MovingWindowRateLimiter(mem_storage)

    client = TestClient(app)

    # In-memory mock database state
    stored_user = User(
        email="commander@maritime.gov.in",
        hashed_password=get_password_hash("OperationalValidKey!123"),
        role=UserRole.SECURITY_OFFICER,
        failed_login_attempts=0,
        account_locked_until=None,
        is_active=True,
    )

    async def mock_get_db():
        mock_session = AsyncMock(spec=AsyncSession)
        
        async def mock_execute(statement):
            mock_res = MagicMock()
            mock_res.scalar_one_or_none.return_value = stored_user
            return mock_res
            
        mock_session.execute = mock_execute
        mock_session.commit = AsyncMock()
        yield mock_session

    app.dependency_overrides[get_db] = mock_get_db

    # Test Failed Login Attempts (Attempts 1 to 4)
    for attempt in range(1, 5):
        resp = client.post("/api/v1/auth/login", json={
            "email": "commander@maritime.gov.in",
            "password": "WrongPasswordAttempt"
        }, headers={"X-Forwarded-For": f"192.168.1.{attempt}"})
        assert resp.status_code == 401
        assert "attempt(s) remaining" in resp.json()["detail"]
        assert stored_user.failed_login_attempts == attempt

    print(" [PASS] Failed attempts 1-4 incremented counter and issued security warnings.")

    # 5th Failed Login Attempt -> Triggers 15-minute Account Lockout
    resp = client.post("/api/v1/auth/login", json={
        "email": "commander@maritime.gov.in",
        "password": "WrongPasswordAttempt"
    }, headers={"X-Forwarded-For": "192.168.1.5"})
    assert resp.status_code == 423
    assert "Maximum login attempts exceeded (5). Account locked for 15 minutes." in resp.json()["detail"]
    assert stored_user.account_locked_until is not None
    print(" [PASS] 5th consecutive failure locked the account with HTTP 423.")

    # 6th Attempt during active lockout -> Rejection without password evaluation
    resp = client.post("/api/v1/auth/login", json={
        "email": "commander@maritime.gov.in",
        "password": "EvenCorrectPasswordDuringLockout"
    }, headers={"X-Forwarded-For": "192.168.1.6"})
    assert resp.status_code == 423
    assert "Account is temporarily locked" in resp.json()["detail"]
    print(" [PASS] Subsequent requests during lockout rejected immediately.")

    # Reset lockout to simulate legitimate authentication after lock expiration
    stored_user.account_locked_until = None
    stored_user.failed_login_attempts = 0

    # Successful Authentication
    resp = client.post("/api/v1/auth/login", json={
        "email": "commander@maritime.gov.in",
        "password": "OperationalValidKey!123"
    }, headers={"X-Forwarded-For": "192.168.1.7"})
    assert resp.status_code == 200
    data = resp.json()

    # CRITICAL: Verify NO token is returned in JSON response body (XSS mitigation)
    assert "access_token" not in data
    assert "token" not in data
    assert "jwt" not in data
    print(" [PASS] Response JSON sanitized: Token is completely absent from body.")

    # Verify token is stored inside strict HTTP-Only cookie
    cookies = resp.headers.get_list("set-cookie")
    cookie_header = "; ".join(cookies)
    assert settings.COOKIE_NAME in cookie_header
    assert "HttpOnly" in cookie_header or "httponly" in cookie_header.lower()
    assert "samesite=strict" in cookie_header.lower()
    print(" [PASS] Set-Cookie header contains HttpOnly and SameSite=Strict.")

    # Test Logout clears cookie
    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200
    logout_cookie_header = "; ".join(logout_resp.headers.get_list("set-cookie"))
    assert settings.COOKIE_NAME in logout_cookie_header
    print(" [PASS] Logout endpoint safely expires the authentication cookie.")

    app.dependency_overrides.clear()

if __name__ == "__main__":
    test_security_core()
    test_api_auth_cookie_and_lockout()
