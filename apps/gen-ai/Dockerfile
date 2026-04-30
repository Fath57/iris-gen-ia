FROM python:3.11-slim

# Évite les fichiers .pyc et force l'affichage des logs en temps réel
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installation des dépendances système (nécessaires pour ChromaDB et la compilation)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpcre2-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie du requirements.txt (assure-toi d'y avoir ajouté fastapi et uvicorn)
COPY requirements.txt .

# Installation propre des dépendances Python
RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir -r requirements.txt

# Copie de tout ton code (y compris le dossier core/)
COPY . .

# Port 8000 pour l'API FastAPI
EXPOSE 8000

# Lancement de l'API via Uvicorn
# --host 0.0.0.0 est OBLIGATOIRE pour que Podman puisse exposer le port vers ton Mac
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]