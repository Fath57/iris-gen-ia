// Wrapper expo-secure-store pour les secrets (token de session).
// Pour les données non sensibles, préférer AsyncStorage côté zustand persist.

import * as SecureStore from 'expo-secure-store'

const KEYS = {
  authToken: 'iris.auth.token',
} as const

export const secureStorage = {
  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.authToken)
  },
  async setToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.authToken, token)
  },
  async clearToken(): Promise<void> {
    await SecureStore.deleteItemAsync(KEYS.authToken)
  },
}
