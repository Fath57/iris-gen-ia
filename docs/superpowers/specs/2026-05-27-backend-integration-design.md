# Backend Integration Design — Conversations + RAG

**Date:** 2026-05-27
**Scope:** Wire the existing web UI to the FastAPI backend for conversations, file upload, and RAG question answering.

---

## Context

Authentication is already integrated. The rest of the app (`App.tsx`) runs entirely on mock data. This spec covers replacing that mock logic with real API calls.

---

## API Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/conversations` | Load conversation list on mount |
| `POST` | `/conversations` | Create conversation (triggered by file upload) |
| `GET` | `/conversations/{id}` | Not needed — full data returned on create/upload |
| `DELETE` | `/conversations/{id}` | Delete from sidebar |
| `POST` | `/conversations/{id}/upload` | Upload file and ingest into RAG |
| `POST` | `/conversations/{id}/ask` | Ask a question, get RAG answer |

---

## Types (`lib/types.ts`)

Replace existing `Message`, `Chat`, `DocumentInfo` with backend-aligned types:

```ts
export type DocumentInfo = {
  id: string
  filename: string
  chunks_count: number
  uploaded_at: string
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type Conversation = {
  id: string
  title: string
  created_at: string
  document: DocumentInfo | null
  messages: Message[]
}

export type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

export type User = {
  id: string
  email: string
  created_at: string
}
```

---

## API Layer (`lib/api.ts`)

Add six typed functions. All accept a `token` string for the `Authorization: Bearer` header. Use the existing `apiFetch` wrapper.

```ts
createConversation(title: string, token: string): Promise<Conversation>
listConversations(token: string): Promise<Conversation[]>
deleteConversation(id: string, token: string): Promise<void>
uploadFile(convId: string, file: File, token: string): Promise<Conversation>
askQuestion(convId: string, question: string, token: string): Promise<{ question: string; reponse: string }>
```

`uploadFile` uses `FormData` (not JSON) and must NOT set `Content-Type` manually — the browser sets it with the correct boundary.

`deleteConversation` returns 204 (no body) — `apiFetch` must not call `res.json()` for 204 responses. Fix: check `res.status === 204` before calling `res.json()`.

---

## Hook `useConversations` (`lib/hooks/useConversations.ts`)

Encapsulates all server state and side effects. `App.tsx` consumes only the public interface.

### State
```ts
conversations: Conversation[]
activeConversation: Conversation | null
isLoading: boolean      // initial list fetch
isUploading: boolean    // file upload + ingestion in progress
isTyping: boolean       // waiting for RAG response
error: string | null    // last server error
```

### Actions
```ts
selectConversation(id: string): void
createAndUpload(file: File): Promise<void>
sendMessage(question: string): Promise<void>
deleteConversation(id: string): Promise<void>
```

### Key flows

**Mount:** `GET /conversations` → populate `conversations`, select first if any.

**createAndUpload(file):**
1. Set `isUploading = true`
2. `POST /conversations` with title = filename without extension
3. `POST /conversations/{id}/upload` with the file
4. Add returned conversation to list, set as active
5. Set `isUploading = false`

**sendMessage(question):**
1. Optimistically append `{ role: 'user', content: question }` to `activeConversation.messages`
2. Set `isTyping = true`
3. `POST /conversations/{id}/ask`
4. Append `{ role: 'assistant', content: reponse }` to messages
5. Set `isTyping = false`
6. On error: set `error`, remove optimistic message

**deleteConversation(id):**
1. `DELETE /conversations/{id}`
2. Remove from `conversations` list
3. If was active, select next conversation or set `activeConversation = null`

### Token
The hook reads the token from `localStorage` key `auth_token` directly (same key used by `auth-context.tsx`). No need to thread it through props.

---

## `App.tsx` Refactor

Remove:
- All `useState` for `chats`, `activeChatId`, `isTyping`, `isUploading`
- `handleNewChat`, `handleFileUpload`, `handleSendMessage` mock implementations
- `mockData` import

Replace with:
```ts
const {
  conversations, activeConversation,
  isLoading, isUploading, isTyping,
  selectConversation, createAndUpload,
  sendMessage, deleteConversation
} = useConversations()
```

Props passed to `<Sidebar>` and `<ChatArea>` remain structurally the same — adapt field names where needed (`created_at` vs `updatedAt`, `document.filename` vs `document.name`).

---

## `apiFetch` fix

Current implementation always calls `res.json()`. Add a guard:

```ts
if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T
return res.json() as Promise<T>
```

---

## Error Handling

- Network / server errors surface via `error` state in the hook
- `isUploading` / `isTyping` always reset in a `finally` block
- Optimistic user message is rolled back on `sendMessage` failure

---

## Out of Scope

- Conversation title editing
- Pagination of conversations list
- File preview
- Streaming responses (RAG endpoint returns full response synchronously)
