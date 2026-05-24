import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch } from './api'
import type { AuthState, User } from './types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  requestOtp: (email: string) => Promise<void>
  verifyOtp: (email: string, code: string) => Promise<void>
  logout: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'auth_token'

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Rehydrate session — verify stored token against /users/me
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }))
      return
    }
    apiFetch<User>('/users/me', { token })
      .then((user) => setState({ user, isAuthenticated: true, isLoading: false }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setState({ user: null, isAuthenticated: false, isLoading: false })
      })
  }, [])

  // Step 1 — request OTP (creates account if first time)
  const requestOtp = async (email: string): Promise<void> => {
    await apiFetch('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  // Step 2 — verify OTP → get token → fetch user profile
  const verifyOtp = async (email: string, code: string): Promise<void> => {
    const { access_token } = await apiFetch<{ access_token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    })
    localStorage.setItem(TOKEN_KEY, access_token)
    const user = await apiFetch<User>('/users/me', { token: access_token })
    setState({ user, isAuthenticated: true, isLoading: false })
  }

  const logout = (): void => {
    localStorage.removeItem(TOKEN_KEY)
    setState({ user: null, isAuthenticated: false, isLoading: false })
  }

  return (
    <AuthContext.Provider value={{ ...state, requestOtp, verifyOtp, logout }}>
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
