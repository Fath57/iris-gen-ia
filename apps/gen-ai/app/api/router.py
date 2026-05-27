from fastapi import APIRouter

from app.controllers.auth import router as auth_router
from app.controllers.conversations import router as conversations_router
from app.controllers.rag import router as rag_router
from app.controllers.users import router as users_router

router = APIRouter()


@router.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


router.include_router(auth_router)
router.include_router(users_router)
router.include_router(conversations_router)
router.include_router(rag_router)
