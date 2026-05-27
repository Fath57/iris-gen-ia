from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from jose import jwt
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.db import Base, get_db
from app.main import app
from app.models.user import User

_engine = create_async_engine("sqlite+aiosqlite:///:memory:")
_Session = async_sessionmaker(_engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def db() -> AsyncSession:
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    async with _Session() as session:
        yield session


@pytest_asyncio.fixture
async def http(db: AsyncSession, tmp_path):
    async def _override_db():
        yield db

    app.dependency_overrides[get_db] = _override_db

    with (
        patch("app.controllers.auth.send_otp_email", new_callable=AsyncMock) as mock_mail,
        patch("app.controllers.conversations.rag_engine") as mock_rag,
        patch.object(settings, "UPLOAD_DIR", str(tmp_path)),
    ):
        mock_rag.ingest.return_value = 12
        mock_rag.ask.return_value = "Réponse de test."
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as client:
            yield client, mock_rag, mock_mail

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def user(db: AsyncSession) -> User:
    u = User(email="user@example.com")
    db.add(u)
    await db.commit()
    await db.refresh(u)
    return u


@pytest.fixture
def token(user: User) -> str:
    return jwt.encode(
        {"sub": user.email, "exp": datetime.now(UTC) + timedelta(minutes=60)},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


@pytest.fixture
def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
