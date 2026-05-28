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
