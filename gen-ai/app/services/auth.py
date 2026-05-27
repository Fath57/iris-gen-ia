import secrets
from datetime import UTC, datetime, timedelta

import bcrypt
from jose import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.user import User

_OTP_TTL_MINUTES = 5


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _hash(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


def _verify(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


async def upsert_and_get_otp(email: str, db: AsyncSession) -> str:
    code = _generate_otp()
    expires_at = datetime.now(UTC) + timedelta(minutes=_OTP_TTL_MINUTES)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(email=email)
        db.add(user)

    user.otp_hash = _hash(code)
    user.otp_expires_at = expires_at
    await db.commit()

    return code


async def verify_otp_and_issue_token(email: str, code: str, db: AsyncSession) -> str:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user is None or user.otp_hash is None or user.otp_expires_at is None:
        raise ValueError("Code invalide ou expiré.")

    if datetime.now(UTC) > user.otp_expires_at:
        raise ValueError("Code invalide ou expiré.")

    if not _verify(code, user.otp_hash):
        raise ValueError("Code invalide ou expiré.")

    user.otp_hash = None
    user.otp_expires_at = None
    await db.commit()

    payload = {
        "sub": email,
        "exp": datetime.now(UTC) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
