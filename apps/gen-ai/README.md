# gen-ai

Backend RAG (Retrieval-Augmented Generation) exposant une API REST pour poser des questions sur des fichiers. Chaque utilisateur crée des conversations, y uploade un fichier (PDF, Word, Excel, audio ou vidéo), puis interroge ce contenu en langage naturel. Les réponses sont générées par un LLM local (Ollama) enrichi du contenu extrait.

Authentification sans mot de passe : l'utilisateur reçoit un code OTP par email et obtient un JWT en échange.

**Stack :** FastAPI · PostgreSQL · SQLAlchemy (async) · ChromaDB · HuggingFace Embeddings · LangChain · Ollama · Whisper

---

## Sommaire

- [Architecture et rôle de chaque composant](#architecture-et-rôle-de-chaque-composant)
- [Processus détaillé](#processus-détaillé)
- [Prérequis](#prérequis)
- [Démarrage rapide](#démarrage-rapide)
- [Variables d'environnement](#variables-denvironnement)
- [API](#api)
  - [Authentification](#authentification)
  - [Utilisateur connecté](#utilisateur-connecté)
  - [Conversations](#conversations)
- [pgAdmin](#pgadmin)
- [Structure du projet](#structure-du-projet)

---

## Architecture et rôle de chaque composant

### FastAPI

Framework web Python asynchrone. Il expose les routes HTTP, valide les requêtes via Pydantic, et gère les dépendances injectées (session DB, utilisateur courant). Chaque route est définie dans un `controller`, la logique métier dans un `service`.

### PostgreSQL + SQLAlchemy (async)

PostgreSQL stocke les données relationnelles : utilisateurs, conversations, documents (métadonnées des fichiers uploadés). SQLAlchemy est l'ORM qui mappe les tables Python en requêtes SQL. La version `asyncio` permet de ne pas bloquer le serveur pendant les requêtes DB.

**Modèles :**

- `User` — compte utilisateur (email + OTP temporaire)
- `Conversation` — conversation appartenant à un user (UUID)
- `Document` — fichier PDF lié à une conversation (chemin, nom, nombre de chunks)

### ChromaDB

Base de données vectorielle. Quand un PDF est uploadé, son contenu est découpé en morceaux (chunks) et chaque chunk est converti en vecteur numérique (embedding). ChromaDB stocke ces vecteurs sur le disque (`CHROMA_PERSIST_DIR`).

Lors d'une question, ChromaDB recherche les chunks les plus proches sémantiquement de la question et les retourne comme contexte au LLM.

**Isolation par conversation :** chaque conversation possède sa propre collection ChromaDB nommée avec son UUID. Les questions d'une conversation ne peuvent pas "fuiter" vers le fichier d'une autre.

**Persistance :** les vecteurs survivent aux redémarrages du serveur. Quand un utilisateur revient sur une conversation, ChromaDB recharge sa collection depuis le disque.

### HuggingFace Embeddings

Modèle `paraphrase-multilingual-MiniLM-L12-v2` qui transforme un texte en vecteur numérique (liste de nombres représentant le sens). Ce modèle est multilingue et s'exécute localement (pas d'appel API externe). Il est utilisé à la fois pour indexer les chunks du fichier et pour encoder la question posée par l'utilisateur.

### LangChain

Bibliothèque d'orchestration pour les pipelines LLM. Elle gère ici :

- **PyPDFLoader / Docx2txtLoader** — extraction du texte selon le type de fichier
- **RecursiveCharacterTextSplitter** — découpe le texte en chunks de 800 caractères avec chevauchement
- **Chroma (vectorstore)** — interface entre LangChain et ChromaDB
- **PromptTemplate** — structure du prompt envoyé au LLM (contexte + question)
- **Chain** — orchestre le pipeline : récupération des chunks → construction du prompt → appel LLM → extraction de la réponse texte

### Whisper (openai-whisper)

Modèle de reconnaissance vocale d'OpenAI qui s'exécute **entièrement en local**. Il transcrit les fichiers audio et vidéo en texte, qui est ensuite indexé dans ChromaDB comme n'importe quel autre document. Il utilise `ffmpeg` en interne pour décoder les formats audio/vidéo. Le modèle `base` est chargé une seule fois au premier appel, puis mis en cache pour les appels suivants.

### Ollama

Serveur LLM local. Il fait tourner le modèle de langage (par défaut `mistral`) directement sur la machine, sans envoyer de données à un service cloud. L'API Ollama est appelée par LangChain via `ChatOllama`.

### Authentification OTP + JWT

Flux sans mot de passe :

1. L'utilisateur demande un code OTP → un code à 6 chiffres est généré, haché (bcrypt) et stocké en DB, puis envoyé par email (valable 5 minutes).
2. L'utilisateur soumet le code → s'il est valide, un JWT signé (HS256) est retourné.
3. Toutes les routes protégées lisent le JWT dans le header `Authorization: Bearer <token>`, le décodent et chargent l'utilisateur correspondant.

### FastAPI-Mail

Bibliothèque d'envoi d'emails asynchrone. Elle envoie le code OTP via SMTP (Gmail par défaut).

---

## Processus détaillé

### 1. Authentification

```
Client                          API                         DB / Mail
  │                               │                              │
  │── POST /auth/request-otp ────>│                              │
  │                               │── upsert user ─────────────>│
  │                               │── génère code 6 chiffres    │
  │                               │── bcrypt(code) → otp_hash ─>│
  │                               │── envoie email OTP ──────────────────> SMTP
  │<── 202 ───────────────────────│                              │
  │                               │                              │
  │── POST /auth/verify-otp ─────>│                              │
  │                               │── charge user par email ───>│
  │                               │── vérifie OTP non expiré    │
  │                               │── bcrypt.verify(code, hash) │
  │                               │── efface otp_hash en DB ───>│
  │                               │── signe JWT { sub: email }  │
  │<── { access_token: JWT } ─────│                              │
```

Le JWT est ensuite envoyé dans chaque requête suivante : `Authorization: Bearer <token>`.

---

### 2. Créer une conversation

```
Client                          API                         PostgreSQL
  │                               │                              │
  │── POST /conversations ───────>│                              │
  │   Authorization: Bearer JWT   │                              │
  │                               │── décode JWT → email         │
  │                               │── SELECT user WHERE email ─>│
  │                               │── INSERT conversation ──────>│
  │                               │   (UUID, user_id, title)     │
  │<── { id: UUID, title, ... } ──│                              │
```

La conversation est vide à ce stade, `document: null`.

---

### 3. Upload et indexation du fichier

```
Client              API               Loader            ChromaDB (disque)
  │                   │                  │                    │
  │── POST /{id}/upload ───────────>│    │                    │
  │   fichier binaire               │    │                    │
  │                                 │    │                    │
  │                   │── vérifie JWT et ownership            │
  │                   │── vérifie que la conversation         │
  │                   │   appartient au user                  │
  │                   │── sauve fichier sur disque            │
  │                   │   UPLOAD_DIR/{conv_id}/fichier        │
  │                   │                  │                    │
  │                   │── load_documents(file_path)          │
  │                   │                  │                    │
  │           selon l'extension :        │                    │
  │           .pdf   → PyPDFLoader       │                    │
  │           .docx  → Docx2txtLoader    │                    │
  │           .xlsx  → openpyxl          │                    │
  │           .mp3 / .mp4 → Whisper      │                    │
  │                   │                  │                    │
  │                   │<── [Document, Document, ...]          │
  │                   │                  │                    │
  │                   │── TextSplitter : découpe en chunks    │
  │                   │   de 800 caractères                   │
  │                   │                  │                    │
  │                   │── HuggingFace Embeddings :            │
  │                   │   chunk_text → [0.12, -0.34, ...]     │
  │                   │   (vecteur de 384 dimensions)         │
  │                   │                  │                    │
  │                   │── ChromaDB.add_documents ────────────>│
  │                   │   collection = str(conv_id)           │
  │                   │   stocke (texte + vecteur) sur disque │
  │                   │                  │                    │
  │                   │── INSERT document en DB               │
  │                   │   (filename, file_path, chunks_count) │
  │<── ConversationOut ──────────────────│                    │
```

**Pourquoi découper en chunks ?**
Un LLM a une fenêtre de contexte limitée. On ne peut pas lui envoyer 200 pages d'un coup. En découpant, on ne lui envoie que les 3-5 passages les plus pertinents pour la question posée.

**Pourquoi des vecteurs ?**
La recherche par vecteurs est une recherche *sémantique* : "voiture" et "automobile" sont proches dans l'espace vectoriel même si les mots sont différents. Une recherche par mots-clés classique raterait ça.

---

### 4. Poser une question

```
Client              API           ChromaDB          Ollama (LLM)
  │                   │               │                   │
  │── POST /{id}/ask >│               │                   │
  │   { question }    │               │                   │
  │                   │── vérifie JWT et ownership        │
  │                   │── vérifie document != null        │
  │                   │                                   │
  │                   │── encode la question en vecteur   │
  │                   │   HuggingFace: "salaire 2023 ?"   │
  │                   │   → [0.08, -0.21, 0.67, ...]      │
  │                   │                                   │
  │                   │── ChromaDB.similarity_search ────>│
  │                   │   collection = str(conv_id)       │
  │                   │   retourne les 4 chunks           │
  │                   │   les plus proches sémantiquement │
  │                   │<── [chunk1, chunk2, chunk3, chunk4]│
  │                   │                                   │
  │                   │── construit le prompt :           │
  │                   │   "Contexte : {chunks}"           │
  │                   │   "Question : {question}"         │
  │                   │   "Réponds en FRANÇAIS"           │
  │                   │                                   │
  │                   │── envoie prompt à Ollama ────────>│
  │                   │                        génère réponse
  │                   │<── réponse texte ─────────────────│
  │<── { reponse } ───│                                   │
```

**Pourquoi RAG et pas juste le LLM seul ?**
Un LLM seul ne connaît pas le contenu du fichier uploadé. Le RAG lui injecte les passages pertinents dans le prompt, ce qui lui permet de répondre sur du contenu qu'il n'a jamais vu pendant son entraînement. Si la réponse n'est pas dans les chunks récupérés, le prompt lui demande d'avouer qu'il ne sait pas plutôt que d'inventer.

---

### 5. Isolation entre conversations

Chaque conversation a son propre UUID. ChromaDB organise les vecteurs en **collections**, une par UUID. Quand une question est posée dans la conversation `A`, la recherche ne cherche que dans la collection `A` — elle n'accède jamais aux vecteurs de la conversation `B`.

```
chroma_db/
├── collection-uuid-A/    ← fichier de la conversation A
│   └── vecteurs du rapport_annuel.pdf
├── collection-uuid-B/    ← fichier de la conversation B
│   └── vecteurs du meeting_audio.mp3
└── collection-uuid-C/    ← fichier de la conversation C
    └── vecteurs du budget.xlsx
```

Les vecteurs sont persistés sur le disque. Si le serveur redémarre, ChromaDB recharge la collection depuis le disque : les conversations et leurs fichiers restent interrogeables indéfiniment.

---

## Prérequis

- [Docker](https://docs.docker.com/get-docker/) et Docker Compose
- [Ollama](https://ollama.com/) installé et le modèle téléchargé en local :

```bash
ollama pull mistral
```

> `ffmpeg` est installé automatiquement dans le container Docker. En développement local hors Docker, installez-le manuellement (`brew install ffmpeg` sur macOS, `apt install ffmpeg` sur Debian/Ubuntu).

---

## Démarrage rapide

```bash
cp .env.example .env   # remplir MAIL_* et JWT_SECRET_KEY
docker compose up --build
```

| Service  | URL                        | Description                      |
|----------|----------------------------|----------------------------------|
| API      | http://localhost:8001      | FastAPI backend                  |
| Swagger  | http://localhost:8001/docs | Documentation interactive        |
| ReDoc    | http://localhost:8001/redoc| Documentation de référence       |
| pgAdmin  | http://localhost:5050      | Interface PostgreSQL              |

> Hot-reload activé : toute modification dans `app/` redémarre le serveur automatiquement.

Les tables sont créées automatiquement au démarrage (`Base.metadata.create_all`).

---

## Variables d'environnement

Copier `.env.example` en `.env` et renseigner les valeurs.

| Variable             | Défaut                                                         | Description                                         |
|----------------------|----------------------------------------------------------------|-----------------------------------------------------|
| `MODEL_NAME`         | `mistral`                                                      | Modèle Ollama à utiliser pour la génération         |
| `OLLAMA_BASE_URL`    | `http://host.docker.internal:11434`                            | URL du serveur Ollama (accessible depuis Docker)    |
| `EMBEDDING_MODEL`    | `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | Modèle HuggingFace pour les embeddings              |
| `UPLOAD_DIR`         | `temp_uploads`                                                 | Répertoire de stockage des PDF uploadés             |
| `CHROMA_PERSIST_DIR` | `chroma_db`                                                    | Répertoire de persistance des vecteurs ChromaDB     |
| `DATABASE_URL`       | `postgresql+asyncpg://user:password@db:5432/genai`             | Connexion PostgreSQL (driver async)                 |
| `MAIL_SERVER`        | `smtp.gmail.com`                                               | Serveur SMTP pour l'envoi des OTP                   |
| `MAIL_PORT`          | `587`                                                          | Port SMTP (587 = STARTTLS)                          |
| `MAIL_USERNAME`      |                                                                | Adresse email expéditrice                           |
| `MAIL_PASSWORD`      |                                                                | Mot de passe ou App Password Gmail                  |
| `MAIL_FROM`          |                                                                | Adresse affichée comme expéditeur                   |
| `JWT_SECRET_KEY`     | `change-me-in-production`                                      | Clé secrète de signature des JWT (à changer !)      |
| `JWT_ALGORITHM`      | `HS256`                                                        | Algorithme de signature JWT                         |
| `JWT_EXPIRE_MINUTES` | `60`                                                           | Durée de vie du JWT en minutes                      |

---

## API

Toutes les routes `/users` et `/conversations` nécessitent le header :

```
Authorization: Bearer <access_token>
```

### Santé

#### `GET /health`

```bash
curl http://localhost:8001/health
```

```json
{ "status": "ok" }
```

---

### Authentification

#### `POST /auth/request-otp`

Envoie un code OTP à 6 chiffres par email. Crée le compte si l'email est inconnu. Le code expire après **5 minutes**.

```bash
curl -X POST http://localhost:8001/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

```json
{ "message": "Code OTP envoyé par email." }
```

#### `POST /auth/verify-otp`

Vérifie le code OTP et retourne un JWT. Le code est invalidé après utilisation.

```bash
curl -X POST http://localhost:8001/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456"}'
```

```json
{ "access_token": "<jwt>", "token_type": "bearer" }
```

---

### Utilisateur connecté

#### `GET /users/me`

Retourne les informations de l'utilisateur authentifié.

```bash
curl http://localhost:8001/users/me \
  -H "Authorization: Bearer <access_token>"
```

```json
{ "id": 1, "email": "user@example.com", "created_at": "2026-01-01T00:00:00Z" }
```

---

### Conversations

Une conversation appartient à un utilisateur et contient au plus un document PDF. Les questions sont posées sur ce document uniquement.

#### `POST /conversations`

Crée une nouvelle conversation.

```bash
curl -X POST http://localhost:8001/conversations \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Analyse du rapport annuel"}'
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Analyse du rapport annuel",
  "created_at": "2026-01-01T00:00:00Z",
  "document": null
}
```

#### `GET /conversations`

Liste toutes les conversations de l'utilisateur connecté, triées par date de création décroissante.

```bash
curl http://localhost:8001/conversations \
  -H "Authorization: Bearer <access_token>"
```

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Analyse du rapport annuel",
    "created_at": "2026-01-01T00:00:00Z",
    "document": {
      "id": "...",
      "filename": "rapport.pdf",
      "chunks_count": 42,
      "uploaded_at": "2026-01-01T01:00:00Z"
    }
  }
]
```

#### `GET /conversations/{id}`

Retourne le détail d'une conversation (avec son document si uploadé).

```bash
curl http://localhost:8001/conversations/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <access_token>"
```

#### `DELETE /conversations/{id}`

Supprime une conversation et son document associé. Retourne `204 No Content`.

```bash
curl -X DELETE http://localhost:8001/conversations/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer <access_token>"
```

#### `POST /conversations/{id}/upload`

Upload un fichier dans la conversation et l'indexe dans ChromaDB. Si un fichier existait déjà, il est remplacé.

**Formats acceptés :**

| Catégorie | Extensions                              | Traitement                          |
|-----------|-----------------------------------------|-------------------------------------|
| PDF       | `.pdf`                                  | Extraction texte page par page      |
| Word      | `.docx`, `.doc`                         | Extraction texte brut               |
| Excel     | `.xlsx`, `.xls`                         | Extraction par feuille, ligne par ligne |
| Audio     | `.mp3`, `.wav`, `.m4a`, `.ogg`, `.flac` | Transcription Whisper (local)       |
| Vidéo     | `.mp4`, `.avi`, `.mov`, `.mkv`, `.webm` | Transcription Whisper (local)       |

- Le fichier est stocké dans `UPLOAD_DIR/{conversation_id}/`
- Les vecteurs sont stockés dans la collection ChromaDB `{conversation_id}`

```bash
curl -X POST http://localhost:8001/conversations/550e8400-e29b-41d4-a716-446655440000/upload \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@rapport.pdf"
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Analyse du rapport annuel",
  "created_at": "2026-01-01T00:00:00Z",
  "document": {
    "id": "...",
    "filename": "rapport.pdf",
    "chunks_count": 42,
    "uploaded_at": "2026-01-01T01:00:00Z"
  }
}
```

#### `POST /conversations/{id}/ask`

Pose une question sur le fichier de la conversation. Le LLM répond **uniquement à partir du contenu du PDF** indexé. Les réponses sont en français.

Retourne une erreur `422` si aucun fichier n'a encore été uploadé dans cette conversation.

```bash
curl -X POST http://localhost:8001/conversations/550e8400-e29b-41d4-a716-446655440000/ask \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Quel est le chiffre d affaires de 2023 ?"}'
```

```json
{
  "question": "Quel est le chiffre d affaires de 2023 ?",
  "reponse": "D'après le document, le chiffre d'affaires de 2023 est de..."
}
```

---

## pgAdmin

Disponible à l'adresse **http://localhost:5050**.

| Champ        | Valeur            |
|--------------|-------------------|
| Email        | `admin@admin.com` |
| Mot de passe | `admin`           |

Pour se connecter à la base de données, enregistrer un nouveau serveur avec :

| Champ        | Valeur       |
|--------------|--------------|
| Host         | `db`         |
| Port         | `5432`       |
| Database     | `genai`      |
| Username     | `user`       |
| Password     | `password`   |

> Utiliser `db` comme host (pas `localhost`) — Docker résout ce nom en interne.

---

## Structure du projet

```
app/
├── main.py                    # Point d'entrée FastAPI, création des tables au démarrage
├── api/
│   └── router.py              # Assemble tous les routers en un seul
├── controllers/               # Handlers HTTP : valident la requête, appellent les services
│   ├── auth.py                # /auth/request-otp, /auth/verify-otp
│   ├── users.py               # /users/me
│   ├── conversations.py       # /conversations et sous-routes (upload, ask)
│   └── rag.py                 # Anciens endpoints /rag (conservés)
├── services/                  # Logique métier pure, sans dépendance HTTP
│   ├── auth.py                # Génération OTP, vérification, émission JWT
│   ├── conversation.py        # CRUD conversations et documents
│   ├── loaders.py             # Factory de chargement : PDF, Word, Excel, audio, vidéo
│   └── rag.py                 # RAGEngine : ingest et ask par collection ChromaDB
├── models/                    # Modèles SQLAlchemy (tables PostgreSQL)
│   ├── user.py                # Table users
│   └── conversation.py        # Tables conversations et documents
├── schemas/                   # Schémas Pydantic (validation entrée/sortie)
│   ├── auth.py                # OTPRequest, OTPVerify, TokenResponse
│   ├── conversation.py        # ConversationCreate, ConversationOut, AskRequest, AskResponse
│   └── rag.py                 # AskRequest (anciens endpoints)
├── mail/
│   └── auth.py                # Envoi de l'email OTP via FastAPI-Mail
└── core/                      # Infrastructure partagée
    ├── config.py              # Variables d'environnement (Pydantic Settings)
    ├── db.py                  # Moteur SQLAlchemy async, session, Base
    ├── deps.py                # Dépendance get_current_user (décode JWT → User)
    └── mail.py                # Configuration FastMail (SMTP)
```
