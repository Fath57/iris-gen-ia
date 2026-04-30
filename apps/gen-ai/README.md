# gen-ai

RAG (Retrieval-Augmented Generation) backend exposing a REST API to ingest PDF documents and answer questions based on their content. Powered by LangChain, ChromaDB, HuggingFace embeddings, and Ollama.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Ollama](https://ollama.com/) running locally with your model pulled:
  ```bash
  ollama pull mistral
  ```

## Build

```bash
docker build -t gen-ai .
```

## Run

```bash
docker run -p 8000:8000 \
  -v gen-ai-data:/data \
  gen-ai
```

The `-v gen-ai-data:/data` flag mounts a named volume so ChromaDB data persists across container restarts.

### Environment variables

| Variable           | Default                                                              | Description                        |
|--------------------|----------------------------------------------------------------------|------------------------------------|
| `MODEL_NAME`       | `mistral`                                                            | Ollama model to use                |
| `OLLAMA_BASE_URL`  | `http://host.docker.internal:11434`                                  | Ollama server URL                  |
| `EMBEDDING_MODEL`  | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`       | HuggingFace embedding model        |
| `UPLOAD_DIR`       | `/data/temp_uploads`                                                 | Temporary directory for PDF files  |
| `CHROMA_PERSIST_DIR` | `/data/chroma_db`                                                  | ChromaDB persistence directory     |

Override any variable with `-e`:

```bash
docker run -p 8000:8000 \
  -v gen-ai-data:/data \
  -e MODEL_NAME=llama3 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  gen-ai
```

## API

### `GET /health`

Returns the service status.

```bash
curl http://localhost:8000/health
```

```json
{ "status": "ok" }
```

---

### `POST /upload`

Uploads and indexes a PDF file.

```bash
curl -X POST http://localhost:8000/upload \
  -F "file=@document.pdf"
```

```json
{ "message": "Fichier document.pdf indexé avec succès (42 chunks)." }
```

---

### `POST /ask`

Asks a question based on the indexed documents.

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is this document about?"}'
```

```json
{
  "question": "What is this document about?",
  "reponse": "..."
}
```

> Responses are always in French regardless of the question language.

## Interactive docs

FastAPI provides auto-generated documentation at:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
