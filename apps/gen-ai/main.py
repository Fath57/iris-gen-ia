import os
import shutil

from core.RAGEngine import RAGEngine
from fastapi import FastAPI, UploadFile, File, HTTPException

from core.constants import UPLOAD_DIR

app = FastAPI(title="RAG Engine")
engine = RAGEngine()
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Seuls les fichiers PDF sont acceptés.")

    file_path = os.path.join(UPLOAD_DIR, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        engine.ingest(file_path)
        return {"message": f"Fichier {file.filename} analysé et indexé avec succès !"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ask")
async def ask_question(question: str):
    try:
        response = engine.ask(question)
        print("======== question:======== ", question)
        print("======== response:======== ", response)
        return {"question": question, "reponse": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

