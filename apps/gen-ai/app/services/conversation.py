import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.conversation import Conversation, Document, Message


async def create_conversation(title: str, user_id: int, db: AsyncSession) -> Conversation:
    conv = Conversation(title=title, user_id=user_id)
    db.add(conv)
    await db.commit()
    conv_id = conv.id
    db.expunge(conv)
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id)
        .options(selectinload(Conversation.document))
    )
    fresh = result.scalar_one()
    print(f"DEBUG create_conversation: id={fresh.id}, document={fresh.document!r}", flush=True)
    return fresh


async def get_user_conversations(user_id: int, db: AsyncSession) -> list[Conversation]:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .options(selectinload(Conversation.document))
        .order_by(Conversation.created_at.desc())
    )
    return list(result.scalars().all())


async def get_conversation(
    conv_id: uuid.UUID, user_id: int, db: AsyncSession
) -> Conversation | None:
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conv_id, Conversation.user_id == user_id)
        .options(selectinload(Conversation.document))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def delete_conversation(conv_id: uuid.UUID, user_id: int, db: AsyncSession) -> bool:
    conv = await get_conversation(conv_id, user_id, db)
    if conv is None:
        return False
    await db.delete(conv)
    await db.commit()
    return True


async def save_messages(conv_id: uuid.UUID, question: str, answer: str, db: AsyncSession) -> None:
    db.add(Message(conversation_id=conv_id, role="user", content=question))
    db.add(Message(conversation_id=conv_id, role="assistant", content=answer))
    await db.commit()


async def attach_document(
    conv: Conversation,
    filename: str,
    file_path: str,
    chunks_count: int,
    db: AsyncSession,
) -> Document:
    doc = Document(
        conversation_id=conv.id,
        filename=filename,
        file_path=file_path,
        chunks_count=chunks_count,
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    return doc
