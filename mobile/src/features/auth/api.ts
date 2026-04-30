import type { Session } from '@/types/auth'
import { request } from '@/lib/http'

export interface RequestOtpInput {
  email: string
}

export interface VerifyOtpInput {
  email: string
  code: string
}

export const authApi = {
  async requestOtp(input: RequestOtpInput): Promise<{ sent: true }> {
    return request<{ sent: true }>('/auth/email', {
      method: 'POST',
      body: input,
    })
  },

  async verifyOtp(input: VerifyOtpInput): Promise<Session> {
    return request<Session>('/auth/verify', {
      method: 'POST',
      body: input,
    })
  },
}
