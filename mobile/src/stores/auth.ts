// Store d'auth : token + user + statut. La persistance est faite via
// expo-secure-store (token uniquement). hydrate() est appelée au boot par
// le RootLayout pour décider du redirect (auth ou app).

import type { Session, User } from '@/types/auth'
import { create } from 'zustand'
import { request } from '@/lib/http'
import { secureStorage } from '@/lib/storage'

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  token: string | null
  user: User | null
  hydrate: () => Promise<void>
  setSession: (session: Session) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  token: null,
  user: null,

  async hydrate() {
    if (get().status === 'loading') return
    set({ status: 'loading' })
    const token = await secureStorage.getToken()
    if (!token) {
      set({ status: 'unauthenticated', token: null, user: null })
      return
    }
    try {
      // Le client HTTP lit le token depuis secureStorage, pas besoin de l'injecter.
      const user = await request<User>('/me')
      set({ status: 'authenticated', token, user })
    }
    catch {
      await secureStorage.clearToken()
      set({ status: 'unauthenticated', token: null, user: null })
    }
  },

  async setSession(session) {
    await secureStorage.setToken(session.token)
    set({ status: 'authenticated', token: session.token, user: session.user })
  },

  async signOut() {
    await secureStorage.clearToken()
    set({ status: 'unauthenticated', token: null, user: null })
  },
}))
