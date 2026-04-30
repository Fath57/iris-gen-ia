import type { Conversation, Message } from '@/types/conversation'
import { request } from '@/lib/http'

export interface AttachDocumentInput {
  name: string
  mimeType: string
  size: number
}

export interface SendMessageInput {
  content: string
}

export const conversationApi = {
  async list(): Promise<Conversation[]> {
    return request<Conversation[]>('/conversations')
  },

  async get(id: string): Promise<Conversation> {
    return request<Conversation>(`/conversations/${id}`)
  },

  async create(title?: string): Promise<Conversation> {
    return request<Conversation>('/conversations', {
      method: 'POST',
      body: title ? { title } : {},
    })
  },

  async remove(id: string): Promise<{ ok: true }> {
    return request<{ ok: true }>(`/conversations/${id}`, { method: 'DELETE' })
  },

  async attachDocument(id: string, input: AttachDocumentInput): Promise<Conversation> {
    return request<Conversation>(`/conversations/${id}/document`, {
      method: 'POST',
      body: input,
    })
  },

  async listMessages(id: string): Promise<Message[]> {
    return request<Message[]>(`/conversations/${id}/messages`)
  },

  async sendMessage(id: string, input: SendMessageInput): Promise<Message[]> {
    return request<Message[]>(`/conversations/${id}/messages`, {
      method: 'POST',
      body: input,
    })
  },
}
