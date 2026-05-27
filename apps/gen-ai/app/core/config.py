from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # RAG
    MODEL_NAME: str = "mistral"
    OLLAMA_BASE_URL: str = "http://host.docker.internal:11434"
    UPLOAD_DIR: str = "temp_uploads"
    CHROMA_PERSIST_DIR: str = "chroma_db"
    EMBEDDING_MODEL: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/genai"

    # Mail
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_PORT: int = 587
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60


settings = Settings()

# Shortcuts used by existing RAG code
MODEL_NAME = settings.MODEL_NAME
OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
UPLOAD_DIR = settings.UPLOAD_DIR
CHROMA_PERSIST_DIR = settings.CHROMA_PERSIST_DIR
EMBEDDING_MODEL = settings.EMBEDDING_MODEL
