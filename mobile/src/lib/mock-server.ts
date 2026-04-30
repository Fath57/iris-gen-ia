// Mock-server in-memory pour développer sans back. Routes alignées sur le
// futur contrat API. Le code OTP est toujours "123456" en mock, et chaque
// envoi log le code à la console (DEV-only).

import type { RequestOptions } from './http'
import type { Session, User } from '@/types/auth'
import type { Conversation, FileAttachment, Message } from '@/types/conversation'
import { ApiError } from './http'

const MOCK_OTP = '123456'
const MOCK_LATENCY_MS = 350

interface OtpEntry {
  code: string
  expiresAt: number
}

interface MockState {
  pendingOtps: Map<string, OtpEntry>
  sessions: Map<string, string>
  users: Map<string, User>
  conversations: Map<string, Conversation>
  messages: Map<string, Message[]>
  ownership: Map<string, string>
}

const state: MockState = {
  pendingOtps: new Map(),
  sessions: new Map(),
  users: new Map(),
  conversations: new Map(),
  messages: new Map(),
  ownership: new Map(),
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function nowIso(): string {
  return new Date().toISOString()
}

async function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function getUserIdFromToken(token: string | null): string {
  if (!token) throw new ApiError(401, 'Non authentifié')
  const userId = state.sessions.get(token)
  if (!userId) throw new ApiError(401, 'Session invalide')
  return userId
}

function assistantReplyFor(userMessage: string, hasDocument: boolean): string {
  if (!hasDocument) {
    return 'Pour vous répondre précisément, soumettez d\'abord le document à analyser.'
  }
  return `Réponse simulée à : "${userMessage}". Le mock-server répondra ici une fois le back branché.`
}

interface AuthEmailResponse { sent: true }
interface VerifyOtpResponse extends Session {}
interface OkResponse { ok: true }
interface CreateConversationBody { title?: string }
interface SendMessageBody { content: string }
interface AttachDocumentBody { name: string, mimeType: string, size: number }

async function handleAuthEmail(body: unknown): Promise<AuthEmailResponse> {
  const email = (body as { email?: string } | undefined)?.email
  if (!email) throw new ApiError(400, 'Email requis')

  state.pendingOtps.set(email, {
    code: MOCK_OTP,
    expiresAt: Date.now() + 5 * 60 * 1000,
  })
  if (__DEV__) console.warn(`[mock] OTP pour ${email} : ${MOCK_OTP}`)
  return { sent: true }
}

async function handleAuthVerify(body: unknown): Promise<VerifyOtpResponse> {
  const { email, code } = (body as { email?: string, code?: string } | undefined) ?? {}
  if (!email || !code) throw new ApiError(400, 'Email et code requis')

  const entry = state.pendingOtps.get(email)
  if (!entry || entry.expiresAt < Date.now()) {
    throw new ApiError(410, 'Code expiré, redemandez un envoi')
  }
  if (entry.code !== code) throw new ApiError(401, 'Code invalide')

  state.pendingOtps.delete(email)

  let user = state.users.get(email)
  if (!user) {
    user = { id: uid(), email, createdAt: nowIso() }
    state.users.set(email, user)
  }

  const token = uid()
  state.sessions.set(token, user.id)
  return { token, user }
}

async function handleMe(token: string | null): Promise<User> {
  const userId = getUserIdFromToken(token)
  const user = [...state.users.values()].find(u => u.id === userId)
  if (!user) throw new ApiError(404, 'Utilisateur introuvable')
  return user
}

async function handleListConversations(token: string | null): Promise<Conversation[]> {
  const userId = getUserIdFromToken(token)
  return [...state.conversations.values()]
    .filter(c => state.ownership.get(c.id) === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function handleCreateConversation(body: unknown, token: string | null): Promise<Conversation> {
  const userId = getUserIdFromToken(token)
  const title = (body as CreateConversationBody | undefined)?.title ?? 'Nouvelle conversation'
  const conv: Conversation = {
    id: uid(),
    title,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  state.conversations.set(conv.id, conv)
  state.ownership.set(conv.id, userId)
  state.messages.set(conv.id, [])
  return conv
}

async function handleGetConversation(id: string, token: string | null): Promise<Conversation> {
  const userId = getUserIdFromToken(token)
  const conv = state.conversations.get(id)
  if (!conv || state.ownership.get(id) !== userId) {
    throw new ApiError(404, 'Conversation introuvable')
  }
  return conv
}

async function handleDeleteConversation(id: string, token: string | null): Promise<OkResponse> {
  const userId = getUserIdFromToken(token)
  if (state.ownership.get(id) !== userId) throw new ApiError(404, 'Conversation introuvable')
  state.conversations.delete(id)
  state.messages.delete(id)
  state.ownership.delete(id)
  return { ok: true }
}

async function handleAttachDocument(id: string, body: unknown, token: string | null): Promise<Conversation> {
  const conv = await handleGetConversation(id, token)
  const file = body as AttachDocumentBody | undefined
  if (!file?.name) throw new ApiError(400, 'Métadonnées du fichier requises')
  const attachment: FileAttachment = {
    id: uid(),
    name: file.name,
    mimeType: file.mimeType,
    size: file.size,
  }
  const updated: Conversation = {
    ...conv,
    document: attachment,
    title: conv.title === 'Nouvelle conversation' ? file.name : conv.title,
    updatedAt: nowIso(),
  }
  state.conversations.set(updated.id, updated)
  return updated
}

async function handleListMessages(id: string, token: string | null): Promise<Message[]> {
  await handleGetConversation(id, token)
  return state.messages.get(id) ?? []
}

async function handleSendMessage(id: string, body: unknown, token: string | null): Promise<Message[]> {
  const conv = await handleGetConversation(id, token)
  const content = (body as SendMessageBody | undefined)?.content?.trim()
  if (!content) throw new ApiError(400, 'Message vide')

  const userMsg: Message = {
    id: uid(),
    conversationId: id,
    role: 'user',
    content,
    status: 'sent',
    createdAt: nowIso(),
  }
  const assistantMsg: Message = {
    id: uid(),
    conversationId: id,
    role: 'assistant',
    content: assistantReplyFor(content, !!conv.document),
    status: 'sent',
    createdAt: nowIso(),
  }
  const list = state.messages.get(id) ?? []
  list.push(userMsg, assistantMsg)
  state.messages.set(id, list)

  state.conversations.set(id, {
    ...conv,
    updatedAt: nowIso(),
    lastMessagePreview: content,
  })

  return [userMsg, assistantMsg]
}

interface RouteMatch {
  pattern: RegExp
  method: 'GET' | 'POST' | 'DELETE'
  handle: (params: string[], options: RequestOptions, token: string | null) => Promise<unknown>
}

const routes: RouteMatch[] = [
  { pattern: /^\/auth\/email$/, method: 'POST', handle: (_, opt) => handleAuthEmail(opt.body) },
  { pattern: /^\/auth\/verify$/, method: 'POST', handle: (_, opt) => handleAuthVerify(opt.body) },
  { pattern: /^\/me$/, method: 'GET', handle: (_, __, token) => handleMe(token) },
  { pattern: /^\/conversations$/, method: 'GET', handle: (_, __, token) => handleListConversations(token) },
  { pattern: /^\/conversations$/, method: 'POST', handle: (_, opt, token) => handleCreateConversation(opt.body, token) },
  { pattern: /^\/conversations\/([^/]+)$/, method: 'GET', handle: ([id], _, token) => handleGetConversation(id!, token) },
  { pattern: /^\/conversations\/([^/]+)$/, method: 'DELETE', handle: ([id], _, token) => handleDeleteConversation(id!, token) },
  { pattern: /^\/conversations\/([^/]+)\/document$/, method: 'POST', handle: ([id], opt, token) => handleAttachDocument(id!, opt.body, token) },
  { pattern: /^\/conversations\/([^/]+)\/messages$/, method: 'GET', handle: ([id], _, token) => handleListMessages(id!, token) },
  { pattern: /^\/conversations\/([^/]+)\/messages$/, method: 'POST', handle: ([id], opt, token) => handleSendMessage(id!, opt.body, token) },
]

export async function mockHandle<T>(path: string, options: RequestOptions, token: string | null): Promise<T> {
  await delay()
  const method = options.method ?? 'GET'
  const cleanPath = path.split('?')[0] ?? path

  for (const route of routes) {
    if (route.method !== method) continue
    const match = route.pattern.exec(cleanPath)
    if (match) {
      const params = match.slice(1)
      const result = await route.handle(params, options, token)
      return result as T
    }
  }
  throw new ApiError(404, `Route mock inconnue : ${method} ${cleanPath}`)
}
