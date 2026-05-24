from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import router
from app.core.db import Base, engine
from app.models import conversation, user  # noqa: F401 — register models for create_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(title="RAG Engine", lifespan=lifespan)
app.include_router(router)
