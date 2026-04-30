// Client HTTP unique pour l'app. En mode mock (env.useMock), redirige vers
// mock-server. Sinon ofetch contre l'API réelle, avec auth header automatique.

import type { RequestOptions } from './http-types'
import { ofetch } from 'ofetch'
import { env } from './env'
import { ApiError } from './http-types'
import { mockHandle } from './mock-server'
import { secureStorage } from './storage'

export { ApiError } from './http-types'
export type { HttpMethod, RequestOptions } from './http-types'

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = await secureStorage.getToken()

  if (env.useMock) {
    return mockHandle<T>(path, options, token)
  }

  try {
    return await ofetch<T>(`${env.apiUrl}${path}`, {
      method: options.method ?? 'GET',
      body: options.body as Record<string, unknown> | undefined,
      query: options.query,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
  }
  catch (error: unknown) {
    if (error instanceof Error && 'response' in error) {
      const response = (error as { response?: { status?: number } }).response
      throw new ApiError(response?.status ?? 0, error.message)
    }
    throw error
  }
}
