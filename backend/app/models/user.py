import enum
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    """Hierarchical Role-Based Access Control (RBAC) tiers."""
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    SECURITY_OFFICER = "security_officer"
    OPERATOR = "operator"
    ANALYST = "analyst"
    VIEWER = "viewer"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    # UUIDv4 primary key: Completely prevents sequential ID enumeration attacks (OWASP API3:2023)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )

    # Unique index for fast lookups during authentication
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False,
    )

    # Stores cryptographic hash (e.g. Argon2id / bcrypt)
    hashed_password: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # Role-Based Access Control
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role_enum", native_enum=True),
        default=UserRole.VIEWER,
        nullable=False,
    )

    # Brute-force & credential stuffing defense (NIST SP 800-63B guidelines)
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    account_locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    # Operational lifecycle flags
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    def is_locked(self) -> bool:
        """Check if user account is currently in a locked state."""
        if not self.account_locked_until:
            return False
        from datetime import timezone
        return datetime.now(timezone.utc) < self.account_locked_until
