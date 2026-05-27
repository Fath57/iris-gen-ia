import io
import uuid

import pytest

from app.models.conversation import Conversation
from app.models.user import User


# ── création ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_conversation(http, auth):
    client, _, _ = http
    res = await client.post("/conversations", json={"title": "Mon rapport"}, headers=auth)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Mon rapport"
    assert "id" in data
    assert data["document"] is None


@pytest.mark.asyncio
async def test_create_conversation_requires_auth(http):
    client, _, _ = http
    res = await client.post("/conversations", json={"title": "Test"})
    assert res.status_code == 401


# ── liste ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_list_conversations_returns_only_own(http, db, auth, user):
    client, _, _ = http
    await client.post("/conversations", json={"title": "A"}, headers=auth)
    await client.post("/conversations", json={"title": "B"}, headers=auth)

    # Conversation d'un autre user — ne doit pas apparaître
    other = User(email="other@example.com")
    db.add(other)
    await db.commit()
    await db.refresh(other)
    db.add(Conversation(title="Other", user_id=other.id))
    await db.commit()

    res = await client.get("/conversations", headers=auth)
    assert res.status_code == 200
    titles = [c["title"] for c in res.json()]
    assert "A" in titles
    assert "B" in titles
    assert "Other" not in titles


@pytest.mark.asyncio
async def test_list_conversations_empty(http, auth):
    client, _, _ = http
    res = await client.get("/conversations", headers=auth)
    assert res.status_code == 200
    assert res.json() == []


# ── détail ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_conversation(http, auth):
    client, _, _ = http
    created = (await client.post("/conversations", json={"title": "Detail"}, headers=auth)).json()
    res = await client.get(f"/conversations/{created['id']}", headers=auth)
    assert res.status_code == 200
    assert res.json()["id"] == created["id"]


@pytest.mark.asyncio
async def test_get_unknown_conversation_returns_404(http, auth):
    client, _, _ = http
    res = await client.get(f"/conversations/{uuid.uuid4()}", headers=auth)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_cannot_access_other_users_conversation(http, db, auth):
    client, _, _ = http
    other = User(email="stranger@example.com")
    db.add(other)
    await db.commit()
    await db.refresh(other)
    conv = Conversation(title="Private", user_id=other.id)
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    res = await client.get(f"/conversations/{conv.id}", headers=auth)
    assert res.status_code == 404


# ── suppression ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_delete_conversation(http, auth):
    client, _, _ = http
    created = (await client.post("/conversations", json={"title": "To delete"}, headers=auth)).json()
    res = await client.delete(f"/conversations/{created['id']}", headers=auth)
    assert res.status_code == 204

    res = await client.get(f"/conversations/{created['id']}", headers=auth)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_delete_unknown_conversation_returns_404(http, auth):
    client, _, _ = http
    res = await client.delete(f"/conversations/{uuid.uuid4()}", headers=auth)
    assert res.status_code == 404


# ── upload ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_pdf(http, auth, tmp_path):
    client, mock_rag, _ = http
    conv = (await client.post("/conversations", json={"title": "PDF"}, headers=auth)).json()

    fake_pdf = tmp_path / "doc.pdf"
    fake_pdf.write_bytes(b"%PDF-1.4 fake")

    with open(fake_pdf, "rb") as f:
        res = await client.post(
            f"/conversations/{conv['id']}/upload",
            headers=auth,
            files={"file": ("doc.pdf", f, "application/pdf")},
        )

    assert res.status_code == 200
    data = res.json()
    assert data["document"]["filename"] == "doc.pdf"
    assert data["document"]["chunks_count"] == 12
    mock_rag.ingest.assert_called_once()


@pytest.mark.asyncio
async def test_upload_unsupported_format_returns_400(http, auth):
    client, _, _ = http
    conv = (await client.post("/conversations", json={"title": "Bad"}, headers=auth)).json()
    res = await client.post(
        f"/conversations/{conv['id']}/upload",
        headers=auth,
        files={"file": ("notes.txt", b"content", "text/plain")},
    )
    assert res.status_code == 400
    assert ".txt" in res.json()["detail"]


@pytest.mark.asyncio
async def test_upload_to_unknown_conversation_returns_404(http, auth):
    client, _, _ = http
    res = await client.post(
        f"/conversations/{uuid.uuid4()}/upload",
        headers=auth,
        files={"file": ("doc.pdf", b"%PDF", "application/pdf")},
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_upload_replaces_existing_document(http, auth, tmp_path):
    client, mock_rag, _ = http
    conv = (await client.post("/conversations", json={"title": "Replace"}, headers=auth)).json()

    for name in ("first.pdf", "second.pdf"):
        f = tmp_path / name
        f.write_bytes(b"%PDF-1.4")
        with open(f, "rb") as fh:
            await client.post(
                f"/conversations/{conv['id']}/upload",
                headers=auth,
                files={"file": (name, fh, "application/pdf")},
            )

    res = await client.get(f"/conversations/{conv['id']}", headers=auth)
    assert res.json()["document"]["filename"] == "second.pdf"
    assert mock_rag.ingest.call_count == 2


# ── question ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_ask_returns_answer(http, auth, tmp_path):
    client, mock_rag, _ = http
    conv = (await client.post("/conversations", json={"title": "Ask"}, headers=auth)).json()

    pdf = tmp_path / "doc.pdf"
    pdf.write_bytes(b"%PDF-1.4")
    with open(pdf, "rb") as f:
        await client.post(
            f"/conversations/{conv['id']}/upload",
            headers=auth,
            files={"file": ("doc.pdf", f, "application/pdf")},
        )

    res = await client.post(
        f"/conversations/{conv['id']}/ask",
        json={"question": "Quelle est la conclusion ?"},
        headers=auth,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["question"] == "Quelle est la conclusion ?"
    assert data["reponse"] == "Réponse de test."
    mock_rag.ask.assert_called_once_with(
        "Quelle est la conclusion ?", collection_id=conv["id"]
    )


@pytest.mark.asyncio
async def test_ask_without_document_returns_422(http, auth):
    client, _, _ = http
    conv = (await client.post("/conversations", json={"title": "Empty"}, headers=auth)).json()
    res = await client.post(
        f"/conversations/{conv['id']}/ask",
        json={"question": "?"},
        headers=auth,
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_ask_on_unknown_conversation_returns_404(http, auth):
    client, _, _ = http
    res = await client.post(
        f"/conversations/{uuid.uuid4()}/ask",
        json={"question": "?"},
        headers=auth,
    )
    assert res.status_code == 404
