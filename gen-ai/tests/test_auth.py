from datetime import UTC, datetime, timedelta

import bcrypt
import pytest
from sqlalchemy import select

from app.models.user import User


def _hash(value: str) -> str:
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()


@pytest.mark.asyncio
async def test_request_otp_returns_202(http):
    client, _, _ = http
    res = await client.post("/auth/request-otp", json={"email": "new@example.com"})
    assert res.status_code == 202


@pytest.mark.asyncio
async def test_request_otp_creates_user_if_missing(http, db):
    client, _, _ = http
    await client.post("/auth/request-otp", json={"email": "created@example.com"})
    result = await db.execute(select(User).where(User.email == "created@example.com"))
    assert result.scalar_one_or_none() is not None


@pytest.mark.asyncio
async def test_request_otp_sends_email(http):
    client, _, mock_mail = http
    await client.post("/auth/request-otp", json={"email": "a@example.com"})
    mock_mail.assert_called_once()


@pytest.mark.asyncio
async def test_verify_otp_success_returns_token(http, db):
    client, _, _ = http
    code = "654321"
    u = User(
        email="otp@example.com",
        otp_hash=_hash(code),
        otp_expires_at=datetime.now(UTC) + timedelta(minutes=5),
    )
    db.add(u)
    await db.commit()

    res = await client.post("/auth/verify-otp", json={"email": "otp@example.com", "code": code})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_verify_otp_wrong_code_returns_401(http, db):
    client, _, _ = http
    u = User(
        email="wrong@example.com",
        otp_hash=_hash("111111"),
        otp_expires_at=datetime.now(UTC) + timedelta(minutes=5),
    )
    db.add(u)
    await db.commit()

    res = await client.post("/auth/verify-otp", json={"email": "wrong@example.com", "code": "999999"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_verify_otp_expired_returns_401(http, db):
    client, _, _ = http
    code = "123456"
    u = User(
        email="expired@example.com",
        otp_hash=_hash(code),
        otp_expires_at=datetime.now(UTC) - timedelta(minutes=1),
    )
    db.add(u)
    await db.commit()

    res = await client.post("/auth/verify-otp", json={"email": "expired@example.com", "code": code})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_verify_otp_unknown_user_returns_401(http):
    client, _, _ = http
    res = await client.post("/auth/verify-otp", json={"email": "ghost@example.com", "code": "000000"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_verify_otp_invalidates_code_after_use(http, db):
    client, _, _ = http
    code = "789012"
    u = User(
        email="once@example.com",
        otp_hash=_hash(code),
        otp_expires_at=datetime.now(UTC) + timedelta(minutes=5),
    )
    db.add(u)
    await db.commit()

    await client.post("/auth/verify-otp", json={"email": "once@example.com", "code": code})

    await db.refresh(u)
    assert u.otp_hash is None
    assert u.otp_expires_at is None
