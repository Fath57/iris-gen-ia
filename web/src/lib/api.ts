const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8001'

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface FetchOptions extends RequestInit {
  token?: string
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: extraHeaders, ...rest } = options

  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (extraHeaders) {
    new Headers(extraHeaders as HeadersInit).forEach((val, key) => headers.set(key, val))
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = (body as { detail?: string }).detail ?? `HTTP ${res.status}`
    throw new ApiError(res.status, message)
  }

  return res.json() as Promise<T>
}
