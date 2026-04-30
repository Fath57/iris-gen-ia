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

export function useAttachDocument(conversationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation<Conversation, Error, AttachDocumentInput>({
    mutationFn: (input) => {
      if (!conversationId) throw new Error('conversationId requis')
      return conversationApi.attachDocument(conversationId, input)
    },
    onSuccess: (updated) => {
      qc.setQueryData(conversationKeys.detail(updated.id), updated)
      qc.setQueryData<Conversation[]>(conversationKeys.list, (prev) => {
        if (!prev) return [updated]
        return prev.map(c => (c.id === updated.id ? updated : c))
      })
    },
  })
}

interface SendContext {
  previousMessages?: Message[]
  tempId: string
}

export function useSendMessage(conversationId: string | undefined) {
  const qc = useQueryClient()
  return useMutation<Message[], Error, SendMessageInput, SendContext>({
    mutationFn: (input) => {
      if (!conversationId) throw new Error('conversationId requis')
      return conversationApi.sendMessage(conversationId, input)
    },
    onMutate: async (input) => {
      if (!conversationId) return { tempId: '' }
      await qc.cancelQueries({ queryKey: conversationKeys.messages(conversationId) })
      const previousMessages = qc.getQueryData<Message[]>(conversationKeys.messages(conversationId))
      const tempId = `temp-${Date.now()}`
      const optimistic: Message = {
        id: tempId,
        conversationId,
        role: 'user',
        content: input.content,
        status: 'sending',
        createdAt: new Date().toISOString(),
      }
      qc.setQueryData<Message[]>(
        conversationKeys.messages(conversationId),
        [...(previousMessages ?? []), optimistic],
      )
      return { previousMessages, tempId }
    },
    onError: (_, __, ctx) => {
      if (ctx && conversationId) {
        qc.setQueryData(conversationKeys.messages(conversationId), ctx.previousMessages)
      }
    },
    onSuccess: (newMessages, _, ctx) => {
      if (!conversationId) return
      qc.setQueryData<Message[]>(conversationKeys.messages(conversationId), (prev) => {
        const withoutTemp = (prev ?? []).filter(m => m.id !== ctx?.tempId)
        return [...withoutTemp, ...newMessages]
      })
      qc.invalidateQueries({ queryKey: conversationKeys.list })
    },
  })
}
