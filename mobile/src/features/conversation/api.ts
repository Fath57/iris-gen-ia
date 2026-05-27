import type { Conversation, FileAttachment, Message } from '@/types/conversation'
import { request } from '@/lib/http'

export interface AttachDocumentInput {
  name: string
  mimeType: string
  size: number
  uri: string
}

export interface SendMessageInput {
  content: string
}

interface DocumentResponse {
  id: string
  filename: string
  chunks_count: number
  uploaded_at: string
}

interface MessageResponse {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface ConversationResponse {
  id: string
  title: string
  created_at: string
  document: DocumentResponse | null
  messages: MessageResponse[]
}

interface AskResponse {
  question: string
  reponse: string
}

function toMessage(conversationId: string, raw: MessageResponse): Message {
  return {
    id: raw.id,
    conversationId,
    role: raw.role,
    content: raw.content,
    status: 'sent',
    createdAt: raw.created_at,
  }
}

function toAttachment(raw: DocumentResponse): FileAttachment {
  return {
    id: raw.id,
    name: raw.filename,
    // Le back ne renvoie pas le mimeType/size : on s'appuie sur chunks_count pour l'affichage.
    mimeType: '',
    size: 0,
    chunksCount: raw.chunks_count,
  }
}

function toConversation(raw: ConversationResponse): Conversation {
  const lastMessage = raw.messages[raw.messages.length - 1]
  return {
    id: raw.id,
    title: raw.title,
    createdAt: raw.created_at,
    // Le back n'expose pas updated_at : on fallback sur le dernier message ou created_at.
    updatedAt: lastMessage?.created_at ?? raw.created_at,
    document: raw.document ? toAttachment(raw.document) : undefined,
    lastMessagePreview: lastMessage?.content,
  }
}

export const conversationApi = {
  async list(): Promise<Conversation[]> {
    const raws = await request<ConversationResponse[]>('/conversations')
    return raws.map(toConversation)
  },

  async get(id: string): Promise<Conversation> {
    const raw = await request<ConversationResponse>(`/conversations/${id}`)
    return toConversation(raw)
  },

  async create(title?: string): Promise<Conversation> {
    // Le back exige un title non vide.
    const raw = await request<ConversationResponse>('/conversations', {
      method: 'POST',
      body: { title: title ?? 'Nouvelle conversation' },
    })
    return toConversation(raw)
  },

  async remove(id: string): Promise<{ ok: true }> {
    await request<void>(`/conversations/${id}`, { method: 'DELETE' })
    return { ok: true }
  },

  async attachDocument(id: string, input: AttachDocumentInput): Promise<Conversation> {
    const form = new FormData()
    // RN/Expo accepte cet objet "file" non-standard pour les uploads multipart.
    form.append('file', {
      uri: input.uri,
      name: input.name,
      type: input.mimeType || 'application/octet-stream',
    } as unknown as Blob)
    const raw = await request<ConversationResponse>(`/conversations/${id}/upload`, {
      method: 'POST',
      body: form,
    })
    return toConversation(raw)
  },

  async listMessages(id: string): Promise<Message[]> {
    const raw = await request<ConversationResponse>(`/conversations/${id}`)
    return raw.messages.map(m => toMessage(raw.id, m))
  },

  async sendMessage(id: string, input: SendMessageInput): Promise<Message[]> {
    const res = await request<AskResponse>(`/conversations/${id}/ask`, {
      method: 'POST',
      body: { question: input.content },
    })
    // Le back persiste les messages mais ne renvoie pas leurs ids/timestamps :
    // on synthétise localement, ils seront remplacés au prochain fetch.
    const now = new Date().toISOString()
    return [
      {
        id: `local-user-${Date.now()}`,
        conversationId: id,
        role: 'user',
        content: res.question,
        status: 'sent',
        createdAt: now,
      },
      {
        id: `local-assistant-${Date.now()}`,
        conversationId: id,
        role: 'assistant',
        content: res.reponse,
        status: 'sent',
        createdAt: now,
      },
    ]
  },
}
