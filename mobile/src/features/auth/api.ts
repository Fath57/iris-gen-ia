import type { Session, User } from '@/types/auth'
import { request } from '@/lib/http'
import { secureStorage } from '@/lib/storage'

export interface RequestOtpInput {
  email: string
}

export interface VerifyOtpInput {
  email: string
  code: string
}

interface TokenResponse {
  access_token: string
  token_type: string
}

interface UserResponse {
  id: number
  email: string
  created_at: string
}

function toUser(raw: UserResponse): User {
  return {
    id: String(raw.id),
    email: raw.email,
    createdAt: raw.created_at,
  }
}

export const authApi = {
  async requestOtp(input: RequestOtpInput): Promise<{ sent: true }> {
    await request<{ message: string }>('/auth/request-otp', {
      method: 'POST',
      body: input,
    })
    return { sent: true }
  },

  async verifyOtp(input: VerifyOtpInput): Promise<Session> {
    const tokenRes = await request<TokenResponse>('/auth/verify-otp', {
      method: 'POST',
      body: input,
    })
    // Token persistant tout de suite pour que le request suivant puisse l'utiliser.
    await secureStorage.setToken(tokenRes.access_token)
    const userRes = await request<UserResponse>('/users/me')
    return { token: tokenRes.access_token, user: toUser(userRes) }
  },
}
