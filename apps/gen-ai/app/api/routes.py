import os
import shutil

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.config import UPLOAD_DIR
from app.core.rag_engine import RAGEngine

router = APIRouter()
engine = RAGEngine()


class AskRequest(BaseModel):
    question: str


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        count = engine.ingest(file_path)
        return {"message": f"Fichier {file.filename} indexé avec succès ({count} chunks)."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ask")
async def ask_question(body: AskRequest):
    try:
        response = engine.ask(body.question)
        return {"question": body.question, "reponse": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
