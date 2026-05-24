import pytest


@pytest.mark.asyncio
async def test_me_returns_current_user(http, user, auth):
    client, _, _ = http
    res = await client.get("/users/me", headers=auth)
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == user.email
    assert "id" in data
    assert "created_at" in data


@pytest.mark.asyncio
async def test_me_without_token_returns_401(http):
    client, _, _ = http
    res = await client.get("/users/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_with_invalid_token_returns_401(http):
    client, _, _ = http
    res = await client.get("/users/me", headers={"Authorization": "Bearer bad.token.here"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_me_with_expired_token_returns_401(http):
    from datetime import UTC, datetime, timedelta
    from jose import jwt
    from app.core.config import settings

    client, _, _ = http
    expired = jwt.encode(
        {"sub": "user@example.com", "exp": datetime.now(UTC) - timedelta(minutes=1)},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    res = await client.get("/users/me", headers={"Authorization": f"Bearer {expired}"})
    assert res.status_code == 401
