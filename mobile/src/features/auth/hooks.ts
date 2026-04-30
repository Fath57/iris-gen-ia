// Hooks auth basés sur react-query. useVerifyOtp branche directement
// setSession sur le store, donc l'auth-gate redirige automatiquement.

import type { RequestOtpInput, VerifyOtpInput } from './api'
import type { Session } from '@/types/auth'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { authApi } from './api'

export function useRequestOtp() {
  return useMutation<{ sent: true }, Error, RequestOtpInput>({
    mutationFn: input => authApi.requestOtp(input),
  })
}

export function useVerifyOtp() {
  const setSession = useAuthStore(s => s.setSession)
  return useMutation<Session, Error, VerifyOtpInput>({
    mutationFn: input => authApi.verifyOtp(input),
    onSuccess: async (session) => {
      await setSession(session)
    },
  })
}

export function useSignOut() {
  const signOut = useAuthStore(s => s.signOut)
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await signOut()
    },
  })
}
