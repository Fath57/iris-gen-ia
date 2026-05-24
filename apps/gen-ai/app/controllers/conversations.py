import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.conversation import (
    AskRequest,
    AskResponse,
    ConversationCreate,
    ConversationOut,
)
from app.services import conversation as conv_service
from app.services.loaders import SUPPORTED_EXTENSIONS
from app.services.rag import rag_engine

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", response_model=ConversationOut, status_code=201)
async def create_conversation(
    body: ConversationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await conv_service.create_conversation(body.title, current_user.id, db)


@router.get("", response_model=list[ConversationOut])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await conv_service.get_user_conversations(current_user.id, db)


@router.get("/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await conv_service.get_conversation(conversation_id, current_user.id, db)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")
    return conv


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deleted = await conv_service.delete_conversation(conversation_id, current_user.id, db)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")


@router.post("/{conversation_id}/upload", response_model=ConversationOut)
async def upload_file(
    conversation_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await conv_service.get_conversation(conversation_id, current_user.id, db)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")

    if conv.document is not None:
        raise HTTPException(status_code=409, detail="Un fichier est déjà associé à cette conversation.")

    ext = Path(file.filename).suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        allowed = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté : {ext}. Formats acceptés : {allowed}",
        )

    upload_dir = os.path.join(settings.UPLOAD_DIR, str(conversation_id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        count = rag_engine.ingest(file_path, collection_id=str(conversation_id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    await conv_service.attach_document(conv, file.filename, file_path, count, db)

    return await conv_service.get_conversation(conversation_id, current_user.id, db)


@router.post("/{conversation_id}/ask", response_model=AskResponse)
async def ask_question(
    conversation_id: uuid.UUID,
    body: AskRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = await conv_service.get_conversation(conversation_id, current_user.id, db)
    if conv is None:
        raise HTTPException(status_code=404, detail="Conversation introuvable.")

    if conv.document is None:
        raise HTTPException(
            status_code=422, detail="Aucun fichier indexé dans cette conversation."
        )

    try:
        answer = rag_engine.ask(body.question, collection_id=str(conversation_id))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    await conv_service.save_messages(conversation_id, body.question, answer, db)

    return AskResponse(question=body.question, reponse=answer)
