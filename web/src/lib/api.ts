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
