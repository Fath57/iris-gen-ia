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
  name: string
  size: number
  type: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: string[] // Pour afficher "[Page 3]" par exemple
}

export interface Chat {
  id: string
  title: string
  updatedAt: Date
  messages: Message[]
  document?: DocumentInfo // Si undefined, le chat est en attente d'un document
}
