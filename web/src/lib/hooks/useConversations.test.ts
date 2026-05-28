import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConversations } from './useConversations'
import * as api from '@/lib/api'

vi.mock('@/lib/api')

const makeConv = (id = '1', hasDoc = false) => ({
  id,
  title: `Conv ${id}`,
  created_at: '2024-01-01T00:00:00Z',
  document: hasDoc
    ? { id: 'd1', filename: 'doc.pdf', chunks_count: 5, uploaded_at: '2024-01-01T00:00:00Z' }
    : null,
  messages: [] as { id: string; role: 'user' | 'assistant'; content: string; created_at: string }[],
})

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.setItem('auth_token', 'tok')
})

describe('initial load', () => {
  it('loads conversations and auto-selects the first', async () => {
    const convs = [makeConv('1'), makeConv('2')]
    vi.mocked(api.listConversations).mockResolvedValue(convs)

    const { result } = renderHook(() => useConversations())
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.conversations).toEqual(convs)
    expect(result.current.activeConversation?.id).toBe('1')
  })

  it('sets error state on fetch failure', async () => {
    vi.mocked(api.listConversations).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.conversations).toEqual([])
  })
})

describe('selectConversation', () => {
  it('sets the active conversation by id and clears pendingNew', async () => {
    const convs = [makeConv('1'), makeConv('2')]
    vi.mocked(api.listConversations).mockResolvedValue(convs)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.startNew())
    expect(result.current.pendingNew).toBe(true)

    act(() => result.current.selectConversation('2'))
    expect(result.current.activeConversation?.id).toBe('2')
    expect(result.current.pendingNew).toBe(false)
  })
})

describe('startNew', () => {
  it('clears active conversation and sets pendingNew', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([makeConv('1')])

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => result.current.startNew())

    expect(result.current.activeConversation).toBeNull()
    expect(result.current.pendingNew).toBe(true)
  })
})

describe('createAndUpload', () => {
  it('creates conversation with filename (no extension) as title, then uploads', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([])
    const created = makeConv('new')
    const uploaded = makeConv('new', true)
    vi.mocked(api.createConversation).mockResolvedValue(created)
    vi.mocked(api.uploadFile).mockResolvedValue(uploaded)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const file = new File([''], 'my-document.pdf', { type: 'application/pdf' })
    await act(() => result.current.createAndUpload(file))

    expect(api.createConversation).toHaveBeenCalledWith('my-document', 'tok')
    expect(api.uploadFile).toHaveBeenCalledWith('new', file, 'tok')
    expect(result.current.activeConversation?.id).toBe('new')
    expect(result.current.pendingNew).toBe(false)
    expect(result.current.isUploading).toBe(false)
  })

  it('sets error and clears isUploading on failure', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([])
    vi.mocked(api.createConversation).mockRejectedValue(new Error('Upload failed'))

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.createAndUpload(new File([''], 'doc.pdf')))

    expect(result.current.error).toBe('Upload failed')
    expect(result.current.isUploading).toBe(false)
  })
})

describe('sendMessage', () => {
  it('appends user message optimistically then appends assistant reply', async () => {
    const conv = makeConv('1', true)
    vi.mocked(api.listConversations).mockResolvedValue([conv])
    vi.mocked(api.askQuestion).mockResolvedValue({ question: 'Hello?', reponse: 'World!' })

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.sendMessage('Hello?'))

    const msgs = result.current.activeConversation!.messages
    expect(msgs).toHaveLength(2)
    expect(msgs[0]).toMatchObject({ role: 'user', content: 'Hello?' })
    expect(msgs[1]).toMatchObject({ role: 'assistant', content: 'World!' })
    expect(result.current.isTyping).toBe(false)
  })

  it('rolls back optimistic message on failure', async () => {
    const conv = makeConv('1', true)
    vi.mocked(api.listConversations).mockResolvedValue([conv])
    vi.mocked(api.askQuestion).mockRejectedValue(new Error('RAG error'))

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.sendMessage('Hello?'))

    expect(result.current.activeConversation!.messages).toHaveLength(0)
    expect(result.current.error).toBe('RAG error')
    expect(result.current.isTyping).toBe(false)
  })

  it('does nothing if no active conversation', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([])

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.sendMessage('Hello?'))

    expect(api.askQuestion).not.toHaveBeenCalled()
  })
})

describe('deleteConversation', () => {
  it('removes the conversation and selects the next one when the active is deleted', async () => {
    const convs = [makeConv('1'), makeConv('2')]
    vi.mocked(api.listConversations).mockResolvedValue(convs)
    vi.mocked(api.deleteConversation).mockResolvedValue(undefined)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.deleteConversation('1'))

    expect(result.current.conversations.map((c) => c.id)).toEqual(['2'])
    expect(result.current.activeConversation?.id).toBe('2')
  })

  it('sets null active when the last conversation is deleted', async () => {
    vi.mocked(api.listConversations).mockResolvedValue([makeConv('1')])
    vi.mocked(api.deleteConversation).mockResolvedValue(undefined)

    const { result } = renderHook(() => useConversations())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(() => result.current.deleteConversation('1'))

    expect(result.current.conversations).toHaveLength(0)
    expect(result.current.activeConversation).toBeNull()
  })
})
