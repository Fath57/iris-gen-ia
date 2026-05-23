import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthState, User } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'auth_user'

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Rehydrate session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const user: User = JSON.parse(raw)
        setState({ user, isAuthenticated: true, isLoading: false })
        return
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    setState((s) => ({ ...s, isLoading: false }))
  }, [])

  // Mock login — replace with real API call
  const login = async (email: string, _password: string): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true }))
    await new Promise((r) => setTimeout(r, 900))

    const user: User = {
      id: crypto.randomUUID(),
      name: email.split('@')[0],
      email,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  // Mock register — replace with real API call
  const register = async (name: string, email: string, _password: string): Promise<void> => {
    setState((s) => ({ ...s, isLoading: true }))
    await new Promise((r) => setTimeout(r, 900))

    const user: User = { id: crypto.randomUUID(), name, email }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  const logout = (): void => {
    localStorage.removeItem(STORAGE_KEY)
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
