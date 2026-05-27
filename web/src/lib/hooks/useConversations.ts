import { useState, useEffect } from 'react'
import {
  listConversations,
  createConversation,
  deleteConversation as apiDelete,
  uploadFile,
  askQuestion,
} from '@/lib/api'
import type { Conversation, Message } from '@/lib/types'

const TOKEN_KEY = 'auth_token'

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [pendingNew, setPendingNew] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tok = () => localStorage.getItem(TOKEN_KEY) ?? ''

  useEffect(() => {
    listConversations(tok())
      .then((convs) => {
        setConversations(convs)
        if (convs.length > 0) setActiveConversation(convs[0])
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [])

  const selectConversation = (id: string) => {
    setPendingNew(false)
    setActiveConversation(conversations.find((c) => c.id === id) ?? null)
  }

  const startNew = () => {
    setActiveConversation(null)
    setPendingNew(true)
  }

  const createAndUpload = async (file: File) => {
    const title = file.name.replace(/\.[^/.]+$/, '')
    setIsUploading(true)
    setError(null)
    try {
      const created = await createConversation(title, tok())
      const uploaded = await uploadFile(created.id, file, tok())
      setConversations((prev) => [uploaded, ...prev])
      setActiveConversation(uploaded)
      setPendingNew(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload échoué')
    } finally {
      setIsUploading(false)
    }
  }

  const sendMessage = async (question: string) => {
    if (!activeConversation) return
    const optimistic: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      created_at: new Date().toISOString(),
    }
    setActiveConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev,
    )
    setIsTyping(true)
    setError(null)
    try {
      const { reponse } = await askQuestion(activeConversation.id, question, tok())
      const reply: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reponse,
        created_at: new Date().toISOString(),
      }
      setActiveConversation((prev) =>
        prev ? { ...prev, messages: [...prev.messages, reply] } : prev,
      )
    } catch (err) {
      setActiveConversation((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== optimistic.id) }
          : prev,
      )
      setError(err instanceof Error ? err.message : 'Envoi échoué')
    } finally {
      setIsTyping(false)
    }
  }

  const deleteConversation = async (id: string) => {
    setError(null)
    try {
      await apiDelete(id, tok())
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id)
        if (activeConversation?.id === id) {
          setActiveConversation(remaining[0] ?? null)
        }
        return remaining
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Suppression échouée')
    }
  }

  return {
    conversations,
    activeConversation,
    pendingNew,
    isLoading,
    isUploading,
    isTyping,
    error,
    startNew,
    selectConversation,
    createAndUpload,
    sendMessage,
    deleteConversation,
  }
}
