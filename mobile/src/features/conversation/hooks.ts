// Hooks react-query pour les conversations. Les clés sont :
// ['conversations'] (liste), ['conversation', id] (détail),
// ['messages', id] (messages d'une conv).
// useSendMessage applique un update optimiste pour afficher le message
// utilisateur sans attendre la réponse serveur.

import type { AttachDocumentInput, SendMessageInput } from './api'
import type { Conversation, Message } from '@/types/conversation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { conversationApi } from './api'

export const conversationKeys = {
  list: ['conversations'] as const,
  detail: (id: string) => ['conversation', id] as const,
  messages: (id: string) => ['messages', id] as const,
}

export function useConversations(enabled = true) {
  return useQuery({
    queryKey: conversationKeys.list,
    queryFn: () => conversationApi.list(),
    enabled,
  })
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: id ? conversationKeys.detail(id) : ['conversation', 'none'],
    queryFn: () => conversationApi.get(id!),
    enabled: !!id,
  })
}

export function useMessages(id: string | undefined) {
  return useQuery({
    queryKey: id ? conversationKeys.messages(id) : ['messages', 'none'],
    queryFn: () => conversationApi.listMessages(id!),
    enabled: !!id,
  })
}

export function useCreateConversation() {
  const qc = useQueryClient()
  return useMutation<Conversation, Error, string | undefined>({
    mutationFn: title => conversationApi.create(title),
    onSuccess: (created) => {
      qc.setQueryData<Conversation[]>(conversationKeys.list, prev => [created, ...(prev ?? [])])
    },
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  return useMutation<{ ok: true }, Error, string>({
    mutationFn: id => conversationApi.remove(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Conversation[]>(
        conversationKeys.list,
        prev => (prev ?? []).filter(c => c.id !== id),
      )
      qc.removeQueries({ queryKey: conversationKeys.detail(id) })
      qc.removeQueries({ queryKey: conversationKeys.messages(id) })
    },
  })
}

// L'id est passé au mutate, pas au hook : permet la création paresseuse
// de conversation (id pas encore connu à la création du hook).
interface AttachVars {
  id: string
  input: AttachDocumentInput
}

export function useAttachDocument() {
  const qc = useQueryClient()
  return useMutation<Conversation, Error, AttachVars>({
    mutationFn: ({ id, input }) => conversationApi.attachDocument(id, input),
    onSuccess: (updated) => {
      qc.setQueryData(conversationKeys.detail(updated.id), updated)
      qc.setQueryData<Conversation[]>(conversationKeys.list, (prev) => {
        if (!prev) return [updated]
        return prev.map(c => (c.id === updated.id ? updated : c))
      })
    },
  })
}

interface SendVars {
  id: string
  input: SendMessageInput
}

interface SendContext {
  previousMessages?: Message[]
  tempId: string
  conversationId: string
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation<Message[], Error, SendVars, SendContext>({
    mutationFn: ({ id, input }) => conversationApi.sendMessage(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: conversationKeys.messages(id) })
      const previousMessages = qc.getQueryData<Message[]>(conversationKeys.messages(id))
      const tempId = `temp-${Date.now()}`
      const optimistic: Message = {
        id: tempId,
        conversationId: id,
        role: 'user',
        content: input.content,
        status: 'sending',
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<Message[]>(
        conversationKeys.messages(id),
        [...(previousMessages ?? []), optimistic],
      )
      return { previousMessages, tempId, conversationId: id }
    },
    onError: (_, __, ctx) => {
      if (ctx) qc.setQueryData(conversationKeys.messages(ctx.conversationId), ctx.previousMessages)
    },
    onSuccess: (newMessages, _, ctx) => {
      qc.setQueryData<Message[]>(conversationKeys.messages(ctx.conversationId), (prev) => {
        const withoutTemp = (prev ?? []).filter(m => m.id !== ctx.tempId)
        return [...withoutTemp, ...newMessages]
      })
      qc.invalidateQueries({ queryKey: conversationKeys.list })
    },
  })
}
