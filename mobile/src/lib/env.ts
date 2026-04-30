// Configuration env via EXPO_PUBLIC_* (inlinée à la build).
// useMock force le routage vers le mock-server tant que le back n'est pas dispo.

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.iris.invalid'
const useMockEnv = process.env.EXPO_PUBLIC_USE_MOCK

export const env = {
  apiUrl,
  // Par défaut on mock tant qu'aucun back n'est branché.
  useMock: useMockEnv === undefined ? true : useMockEnv === '1',
} as const
