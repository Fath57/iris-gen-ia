export type MessageRole = 'user' | 'assistant'
export type MessageStatus = 'sending' | 'sent' | 'failed'

export interface FileAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  uri?: string
  chunksCount?: number
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  status: MessageStatus
  createdAt: string
  attachments?: FileAttachment[]
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  // Le fichier soumis qui sert de contexte à toute la conversation.
  document?: FileAttachment
  lastMessagePreview?: string
}
