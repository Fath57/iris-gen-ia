# Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data and fake handlers in `App.tsx` with real backend API calls for conversations, file upload, and RAG question answering.

**Architecture:** Add typed API functions to `lib/api.ts`, extract all server state into a new `useConversations` hook, and update `App.tsx` + child components to consume the hook. A conversation is created in the backend only when the user uploads a file — clicking "Nouveau document" just shows the dropzone locally.

**Tech Stack:** React 19, TypeScript, Vitest, `@testing-library/react`, native `fetch`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `web/src/lib/types.ts` | Modify | Replace `Chat`/`Message`/`DocumentInfo` with backend-aligned types |
| `web/src/lib/api.ts` | Modify | Fix 204 handling, auto-detect FormData, add 5 conversation functions |
| `web/src/lib/api.test.ts` | Create | Unit tests for each API function |
| `web/src/lib/hooks/useConversations.ts` | Create | All server state + actions: load, upload, ask, delete |
| `web/src/lib/hooks/useConversations.test.ts` | Create | Unit tests for hook state transitions |
| `web/src/components/Sidebar.tsx` | Modify | Adapt to `Conversation[]`, add delete button on hover |
| `web/src/components/ChatArea.tsx` | Modify | Adapt to `Conversation`, simplify `onFileUpload` signature |
| `web/src/App.tsx` | Modify | Remove all mock state/handlers, consume `useConversations` |

---

## Task 1 — Update types

**Files:**
- Modify: `web/src/lib/types.ts`

- [ ] **Step 1: Replace domain types**

Replace the full content of `web/src/lib/types.ts`:

```ts
// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  created_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// ── Domain ────────────────────────────────────────────────────────────────────

export interface DocumentInfo {
  id: string
  filename: string
  chunks_count: number
  uploaded_at: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface Conversation {
  id: string
  title: string
  created_at: string
  document: DocumentInfo | null
  messages: Message[]
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/lib/types.ts
git commit -m "refactor(types): align domain types with backend schema"
```

---

## Task 2 — Fix `apiFetch` + add API functions

**Files:**
- Modify: `web/src/lib/api.ts`
- Create: `web/src/lib/api.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/api.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import {
  ApiError,
  apiFetch,
  listConversations,
  createConversation,
  deleteConversation,
  uploadFile,
  askQuestion,
} from './api'

const TOKEN = 'test-token'

function mockFetch(status: number, body?: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => (h === 'content-length' && status === 204 ? '0' : null) },
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => vi.restoreAllMocks())

describe('apiFetch', () => {
  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal('fetch', mockFetch(204))
    const result = await apiFetch('/any')
    expect(result).toBeUndefined()
  })

  it('throws ApiError with detail message on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'Non autorisé' }))
    await expect(apiFetch('/any')).rejects.toThrow('Non autorisé')
    await expect(apiFetch('/any')).rejects.toBeInstanceOf(ApiError)
  })

  it('sets Content-Type: application/json for string bodies', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {}))
    await apiFetch('/any', { method: 'POST', body: JSON.stringify({ x: 1 }) })
    const headers: Headers = (fetch as Mock).mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('does NOT set Content-Type for FormData bodies', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {}))
    await apiFetch('/any', { method: 'POST', body: new FormData() })
    const headers: Headers = (fetch as Mock).mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBeNull()
  })
})

describe('listConversations', () => {
  it('calls GET /conversations with Bearer token', async () => {
    const convs = [{ id: '1', title: 'Doc', created_at: '2024-01-01', document: null, messages: [] }]
    vi.stubGlobal('fetch', mockFetch(200, convs))
    const result = await listConversations(TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations$/)
    expect((opts.headers as Headers).get('Authorization')).toBe(`Bearer ${TOKEN}`)
    expect(result).toEqual(convs)
  })
})

describe('createConversation', () => {
  it('calls POST /conversations with title in JSON body', async () => {
    const conv = { id: '1', title: 'My Doc', created_at: '2024-01-01', document: null, messages: [] }
    vi.stubGlobal('fetch', mockFetch(201, conv))
    const result = await createConversation('My Doc', TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations$/)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ title: 'My Doc' })
    expect(result).toEqual(conv)
  })
})

describe('deleteConversation', () => {
  it('calls DELETE /conversations/:id and returns undefined', async () => {
    vi.stubGlobal('fetch', mockFetch(204))
    const result = await deleteConversation('abc-123', TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations\/abc-123$/)
    expect(opts.method).toBe('DELETE')
    expect(result).toBeUndefined()
  })
})

describe('uploadFile', () => {
  it('calls POST /conversations/:id/upload with FormData', async () => {
    const conv = {
      id: '1', title: 'Doc', created_at: '2024-01-01',
      document: { id: 'd1', filename: 'doc.pdf', chunks_count: 5, uploaded_at: '2024-01-01' },
      messages: [],
    }
    vi.stubGlobal('fetch', mockFetch(200, conv))
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const result = await uploadFile('1', file, TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations\/1\/upload$/)
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(result).toEqual(conv)
  })
})

describe('askQuestion', () => {
  it('calls POST /conversations/:id/ask with question in JSON body', async () => {
    const answer = { question: 'What?', reponse: 'Because.' }
    vi.stubGlobal('fetch', mockFetch(200, answer))
    const result = await askQuestion('1', 'What?', TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations\/1\/ask$/)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ question: 'What?' })
    expect(result).toEqual(answer)
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /path/to/web && npx vitest run src/lib/api.test.ts
```

Expected: FAIL — functions not yet exported.

- [ ] **Step 3: Replace `lib/api.ts`**

Replace the full content of `web/src/lib/api.ts`:

```ts
import type { Conversation } from './types'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8001'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface FetchOptions extends RequestInit {
  token?: string
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: extraHeaders, body, ...rest } = options

  const headers = new Headers()
  // Let the browser set Content-Type for FormData (needs the boundary parameter)
  if (!(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  if (extraHeaders) {
    new Headers(extraHeaders as HeadersInit).forEach((val, key) => headers.set(key, val))
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...rest, body, headers })

  if (!res.ok) {
    const detail = await res.json().catch(() => ({}))
    const message = (detail as { detail?: string }).detail ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message)
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T
  return res.json() as Promise<T>
}

export function listConversations(token: string): Promise<Conversation[]> {
  return apiFetch('/conversations', { token })
}

export function createConversation(title: string, token: string): Promise<Conversation> {
  return apiFetch('/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
    token,
  })
}

export function deleteConversation(id: string, token: string): Promise<void> {
  return apiFetch(`/conversations/${id}`, { method: 'DELETE', token })
}

export function uploadFile(convId: string, file: File, token: string): Promise<Conversation> {
  const body = new FormData()
  body.append('file', file)
  return apiFetch(`/conversations/${convId}/upload`, { method: 'POST', body, token })
}

export function askQuestion(
  convId: string,
  question: string,
  token: string,
): Promise<{ question: string; reponse: string }> {
  return apiFetch(`/conversations/${convId}/ask`, {
    method: 'POST',
    body: JSON.stringify({ question }),
    token,
  })
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/api.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/api.ts web/src/lib/api.test.ts
git commit -m "feat(api): add conversation API functions, fix 204 + FormData handling"
```

---

## Task 3 — Create `useConversations` hook

**Files:**
- Create: `web/src/lib/hooks/useConversations.ts`
- Create: `web/src/lib/hooks/useConversations.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/src/lib/hooks/useConversations.test.ts`:

```ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConversations } from './useConversations'
import * as api from '@/lib/api'

vi.mock('@/lib/api')

const makeConv = (id = '1', hasDoc = false) => ({
  id,
  title: `Conv ${id}`,
  created_at: '2024-01-01T00:00:00Z',
  document: hasDoc
    ? { id: 'd1', filename: 'doc.pdf', chunks_count: 5, uploaded_at: '2024-01-01T00:00:00Z' }
    : null,
  messages: [] as { id: string; role: 'user' | 'assistant'; content: string; created_at: string }[],
})

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('auth_token', 'tok')
})

describe('initial load', () => {
  it('loads conversations and auto-selects the first', async () => {
    const convs = [makeConv('1'), makeConv('2')]
    vi.mocked(api.listConversations).mockResolvedValue(convs)

    const { result } = renderHook(() => useConversations())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.conversations).toEqual(convs)
    expect(result.current.activeConversation?.id).toBe('1')
  })

  it('sets error state on fetch failure', async () => {
    vi.mocked(api.listConversations).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.conversations).toEqual([])
  })
})

describe('selectConversation', () => {
  it('sets the active conversation by id and clears pendingNew', async () => {
    const convs = [makeConv('1'), makeConv('2')]
    vi.mocked(api.listConversations).mockResolvedValue(convs)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.startNew())
    expect(result.current.pendingNew).toBe(true)

    act(() => result.current.selectConversation('2'))
    expect(result.current.activeConversation?.id).toBe('2')
    expect(result.current.pendingNew).toBe(false)
  })
})

describe('startNew', () => {
  it('clears active conversation and sets pendingNew', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([makeConv('1')])

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.startNew())

    expect(result.current.activeConversation).toBeNull()
    expect(result.current.pendingNew).toBe(true)
  })
})

describe('createAndUpload', () => {
  it('creates conversation with filename (no extension) as title, then uploads', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([])
    const created = makeConv('new')
    const uploaded = makeConv('new', true)
    vi.mocked(api.createConversation).mockResolvedValue(created)
    vi.mocked(api.uploadFile).mockResolvedValue(uploaded)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File([''], 'my-document.pdf', { type: 'application/pdf' })
    await act(() => result.current.createAndUpload(file))

    expect(api.createConversation).toHaveBeenCalledWith('my-document', 'tok')
    expect(api.uploadFile).toHaveBeenCalledWith('new', file, 'tok')
    expect(result.current.activeConversation?.id).toBe('new')
    expect(result.current.pendingNew).toBe(false)
    expect(result.current.isUploading).toBe(false)
  })

  it('sets error and clears isUploading on failure', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([])
    vi.mocked(api.createConversation).mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.createAndUpload(new File([''], 'doc.pdf')))

    expect(result.current.error).toBe('Upload failed')
    expect(result.current.isUploading).toBe(false)
  })
})

describe('sendMessage', () => {
  it('appends user message optimistically then appends assistant reply', async () => {
    const conv = makeConv('1', true)
    vi.mocked(api.listConversations).mockResolvedValue([conv])
    vi.mocked(api.askQuestion).mockResolvedValue({ question: 'Hello?', reponse: 'World!' })

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.sendMessage('Hello?'))

    const msgs = result.current.activeConversation!.messages
    expect(msgs).toHaveLength(2)
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'Hello?' })
    expect(msgs[1]).toMatchObject({ role: 'assistant', content: 'World!' })
    expect(result.current.isTyping).toBe(false)
  })

  it('rolls back optimistic message on failure', async () => {
    const conv = makeConv('1', true)
    vi.mocked(api.listConversations).mockResolvedValue([conv])
    vi.mocked(api.askQuestion).mockRejectedValue(new Error('RAG error'))

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.sendMessage('Hello?'))

    expect(result.current.activeConversation!.messages).toHaveLength(0)
    expect(result.current.error).toBe('RAG error')
    expect(result.current.isTyping).toBe(false)
  })

  it('does nothing if no active conversation', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([])

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.sendMessage('Hello?'))

    expect(api.askQuestion).not.toHaveBeenCalled()
  })
})

describe('deleteConversation', () => {
  it('removes the conversation and selects the next one when the active is deleted', async () => {
    const convs = [makeConv('1'), makeConv('2')]
    vi.mocked(api.listConversations).mockResolvedValue(convs)
    vi.mocked(api.deleteConversation).mockResolvedValue(undefined)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.deleteConversation('1'))

    expect(result.current.conversations.map((c) => c.id)).toEqual(['2'])
    expect(result.current.activeConversation?.id).toBe('2')
  })

  it('sets null active when the last conversation is deleted', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([makeConv('1')])
    vi.mocked(api.deleteConversation).mockResolvedValue(undefined)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.deleteConversation('1'))

    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.activeConversation).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npx vitest run src/lib/hooks/useConversations.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the hook**

Create `web/src/lib/hooks/useConversations.ts`:

```ts
import { useState, useEffect } from 'react'
import {
  listConversations,
  createConversation,
  deleteConversation as apiDelete,
  uploadFile,
  askQuestion,
} from '@/lib/api'
import type { Conversation, Message } from '@/lib/types'

const TOKEN_KEY = 'auth_token'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [pendingNew, setPendingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tok = () => localStorage.getItem(TOKEN_KEY) ?? ''

  useEffect(() => {
    listConversations(tok())
      .then((convs) => {
        setConversations(convs)
        if (convs.length > 0) setActiveConversation(convs[0])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  const selectConversation = (id: string) => {
    setPendingNew(false)
    setActiveConversation(conversations.find((c) => c.id === id) ?? null)
  }

  const startNew = () => {
    setActiveConversation(null)
    setPendingNew(true)
  }

  const createAndUpload = async (file: File) => {
    const title = file.name.replace(/\.[^/.]+$/, '')
    setIsUploading(true)
    setError(null)
    try {
      const created = await createConversation(title, tok())
      const uploaded = await uploadFile(created.id, file, tok())
      setConversations((prev) => [uploaded, ...prev])
      setActiveConversation(uploaded)
      setPendingNew(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload échoué')
    } finally {
      setIsUploading(false)
    }
  }

  const sendMessage = async (question: string) => {
    if (!activeConversation) return
    const optimistic: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    }
    setActiveConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev,
    )
    setIsTyping(true)
    setError(null)
    try {
      const { reponse } = await askQuestion(activeConversation.id, question, tok())
      const reply: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reponse,
        created_at: new Date().toISOString(),
      }
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, reply] } : prev,
      )
    } catch (err) {
      setActiveConversation((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) }
          : prev,
      )
      setError(err instanceof Error ? err.message : 'Envoi échoué')
    } finally {
      setIsTyping(false)
    }
  }

  const deleteConversation = async (id: string) => {
    setError(null)
    try {
      await apiDelete(id, tok())
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id)
        if (activeConversation?.id === id) {
          setActiveConversation(remaining[0] ?? null)
        }
        return remaining
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression échouée')
    }
  }

  return {
    conversations,
    activeConversation,
    pendingNew,
    isLoading,
    isUploading,
    isTyping,
    error,
    startNew,
    selectConversation,
    createAndUpload,
    sendMessage,
    deleteConversation,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npx vitest run src/lib/hooks/useConversations.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add web/src/lib/hooks/useConversations.ts web/src/lib/hooks/useConversations.test.ts
git commit -m "feat(hook): add useConversations with full backend integration"
```

---

## Task 4 — Update `Sidebar`

**Files:**
- Modify: `web/src/components/Sidebar.tsx`

- [ ] **Step 1: Replace full file content**

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, LogOut, FileText, Bot, Trash2 } from 'lucide-react'
import { Conversation } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

interface ConvGroup {
  label: string
  items: Conversation[]
}

function groupConversations(convs: Conversation[]): ConvGroup[] {
  const now = new Date()
  const today: Conversation[] = []
  const yesterday: Conversation[] = []
  const older: Conversation[] = []

  for (const conv of convs) {
    const diffDays = (now.getTime() - new Date(conv.created_at).getTime()) / 86_400_000
    if (diffDays < 1) today.push(conv)
    else if (diffDays < 2) yesterday.push(conv)
    else older.push(conv)
  }

  return [
    { label: "Aujourd'hui", items: today },
    { label: 'Hier', items: yesterday },
    { label: 'Plus ancien', items: older },
  ]
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const groups = groupConversations(conversations)
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col w-64 shrink-0 h-full bg-[#111111] border-r border-white/[0.06]">
      <div className="flex items-center justify-between px-3.5 py-2.5 mb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-violet-500/15 border border-violet-400/25 flex items-center justify-center shrink-0">
            <Bot size={13} className="text-violet-400" />
          </div>
          <span className="text-[14px] font-medium text-white/88 tracking-[-0.01em]">
            DocuBot AI
          </span>
        </div>
        <span className="text-[10px] font-medium text-violet-500/70 bg-violet-500/10 border border-violet-500/20 rounded-[5px] px-1.5 py-0.5">
          Beta
        </span>
      </div>

      <div className="px-2.5 pb-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-violet-500/10 border border-violet-400/20 text-violet-300 text-[13.5px] font-medium hover:bg-violet-500/20 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Nouveau document
        </button>
      </div>

      <ScrollArea className="flex-1 px-1.5">
        <div className="py-1 space-y-5">
          {groups.map(({ label, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/20 px-2.5 mb-1">
                  {label}
                </p>
                <div className="flex flex-col gap-px">
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-1 px-2.5 py-2 rounded-lg transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-white/[0.08] text-white/90'
                          : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                      }`}
                    >
                      <button
                        onClick={() => onSelectConversation(conv.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-[13.5px] text-left font-medium cursor-pointer"
                      >
                        <FileText
                          size={13}
                          className={`shrink-0 ${conv.document ? 'text-blue-400/60' : 'opacity-40'}`}
                        />
                        <span className="truncate">{conv.title}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conv.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </ScrollArea>

      <div className="p-2.5 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] border border-white/[0.06] bg-[#161616] hover:border-white/[0.11] transition-colors">
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[10px] font-semibold tracking-wide text-white shrink-0">
            {user?.email?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="flex flex-col gap-px items-start flex-1 min-w-0 overflow-hidden">
            <span className="text-[13px] font-medium text-white/90 truncate leading-[1.3]">
              {user?.email ?? 'Inconnu'}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-[5px] h-[5px] rounded-full bg-violet-500/50 shrink-0" />
              <span className="text-[10.5px] text-white/30 leading-none">Plan gratuit</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer shrink-0"
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/Sidebar.tsx
git commit -m "feat(sidebar): adapt to Conversation type, add delete on hover"
```

---

## Task 5 — Update `ChatArea`

**Files:**
- Modify: `web/src/components/ChatArea.tsx`

- [ ] **Step 1: Replace full file content**

```tsx
import { useState, useEffect, useRef } from 'react'
import { Conversation } from '@/lib/types'
import { ChatMessage, TypingIndicator } from './chat-message'
import { InputBox } from './input-box'
import { EmptyState } from './empty-state'
import { FileDropzone } from './file-dropzone'
import { AnalysisLoader } from './analysis-loader'
import { FileText, MoreVertical } from 'lucide-react'

interface ChatAreaProps {
  conversation: Conversation | null
  showDropzone: boolean
  onSendMessage: (content: string) => void
  onFileUpload: (file: File) => void
  isTyping: boolean
  isUploading: boolean
}

export function ChatArea({
  conversation,
  showDropzone,
  onSendMessage,
  onFileUpload,
  isTyping,
  isUploading,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || !conversation) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isUploading) return <AnalysisLoader />

  if (!conversation && !showDropzone) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0d0d] text-white/20 text-sm">
        Sélectionnez ou créez un document
      </div>
    )
  }

  if (showDropzone) return <FileDropzone onFileUpload={onFileUpload} />

  const isEmpty = conversation!.messages.length === 0

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0d]">
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.05] bg-[#0d0d0d]/80 backdrop-blur-md sticky top-1 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            <FileText size={14} className="text-blue-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white/90 truncate">
              {conversation!.document?.filename ?? conversation!.title}
            </span>
            <span className="text-[11px] text-white/40">
              {conversation!.document
                ? `${conversation!.document.chunks_count} chunks · Analysé et prêt`
                : 'En attente de document'}
            </span>
          </div>
        </div>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState
            documentName={conversation!.document?.filename ?? conversation!.title}
            onSuggestionClick={(text) => setInput(text)}
          />
        ) : (
          <div className="py-6 max-w-3xl mx-auto px-6 flex flex-col gap-6">
            {conversation!.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.05] px-6 pt-4 pb-5 bg-gradient-to-t from-[#0d0d0d] to-transparent">
        <div className="max-w-3xl mx-auto">
          <InputBox
            value={input}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
            placeholder="Posez une question sur le document…"
          />
          <p className="text-center text-[11px] text-white/20 mt-2">
            L'IA peut faire des erreurs. Vérifiez toujours les sources dans le document.
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/ChatArea.tsx
git commit -m "feat(chat-area): adapt to Conversation type, simplify upload signature"
```

---

## Task 6 — Refactor `App.tsx`

**Files:**
- Modify: `web/src/App.tsx`

- [ ] **Step 1: Replace full file content**

```tsx
import './App.css'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { useConversations } from './lib/hooks/useConversations'

export default function App() {
  const {
    conversations,
    activeConversation,
    pendingNew,
    isUploading,
    isTyping,
    startNew,
    selectConversation,
    createAndUpload,
    sendMessage,
    deleteConversation,
  } = useConversations()

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] font-sans">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelectConversation={selectConversation}
        onNewConversation={startNew}
        onDeleteConversation={deleteConversation}
      />
      <ChatArea
        conversation={activeConversation}
        showDropzone={pendingNew}
        onSendMessage={sendMessage}
        onFileUpload={createAndUpload}
        isTyping={isTyping}
        isUploading={isUploading}
      />
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd web && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: all PASS.

- [ ] **Step 4: Commit**

```bash
git add web/src/App.tsx
git commit -m "feat(app): wire useConversations hook, remove all mock data"
```

---

## Task 7 — Smoke test

- [ ] **Step 1: Verify the full user flow in the browser**

Ensure backend runs at `http://localhost:8001` and frontend at `http://localhost:5173`.

1. **Load** — sidebar shows existing conversations; first is auto-selected
2. **New document** — click "Nouveau document" → FileDropzone appears
3. **Upload** — drop a PDF → AnalysisLoader shows during upload → conversation appears in sidebar with `N chunks · Analysé et prêt`
4. **Ask** — type a question, press Enter → message appears immediately (optimistic), typing indicator shows, then assistant reply appears
5. **Delete** — hover a sidebar item → trash icon appears; click → conversation removed, next auto-selected

- [ ] **Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete backend integration — conversations, upload, RAG Q&A"
```
