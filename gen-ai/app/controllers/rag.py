import os
import shutil

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import settings
from app.schemas.rag import AskRequest
from app.services.rag import rag_engine

router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        count = rag_engine.ingest(file_path)
        return {"message": f"Fichier {file.filename} indexé avec succès ({count} chunks)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask")
async def ask_question(body: AskRequest):
    try:
        response = rag_engine.ask(body.question)
        return {"question": body.question, "reponse": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
