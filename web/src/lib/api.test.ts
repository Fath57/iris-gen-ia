import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import {
  ApiError,
  apiFetch,
  listConversations,
  createConversation,
  deleteConversation,
  uploadFile,
  askQuestion,
} from './api'

const TOKEN = 'test-token'

function mockFetch(status: number, body?: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (h: string) => (h === 'content-length' && status === 204 ? '0' : null) },
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => vi.restoreAllMocks())

describe('apiFetch', () => {
  it('returns undefined for 204 responses', async () => {
    vi.stubGlobal('fetch', mockFetch(204))
    const result = await apiFetch('/any')
    expect(result).toBeUndefined()
  })

  it('throws ApiError with detail message on non-ok response', async () => {
    vi.stubGlobal('fetch', mockFetch(401, { detail: 'Non autorisé' }))
    await expect(apiFetch('/any')).rejects.toThrow('Non autorisé')
    await expect(apiFetch('/any')).rejects.toBeInstanceOf(ApiError)
  })

  it('sets Content-Type: application/json for string bodies', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {}))
    await apiFetch('/any', { method: 'POST', body: JSON.stringify({ x: 1 }) })
    const headers: Headers = (fetch as Mock).mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })

  it('does NOT set Content-Type for FormData bodies', async () => {
    vi.stubGlobal('fetch', mockFetch(200, {}))
    await apiFetch('/any', { method: 'POST', body: new FormData() })
    const headers: Headers = (fetch as Mock).mock.calls[0][1].headers
    expect(headers.get('Content-Type')).toBeNull()
  })
})

describe('listConversations', () => {
  it('calls GET /conversations with Bearer token', async () => {
    const convs = [{ id: '1', title: 'Doc', created_at: '2024-01-01', document: null, messages: [] }]
    vi.stubGlobal('fetch', mockFetch(200, convs))
    const result = await listConversations(TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations$/)
    expect((opts.headers as Headers).get('Authorization')).toBe(`Bearer ${TOKEN}`)
    expect(result).toEqual(convs)
  })
})

describe('createConversation', () => {
  it('calls POST /conversations with title in JSON body', async () => {
    const conv = { id: '1', title: 'My Doc', created_at: '2024-01-01', document: null, messages: [] }
    vi.stubGlobal('fetch', mockFetch(201, conv))
    const result = await createConversation('My Doc', TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations$/)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ title: 'My Doc' })
    expect(result).toEqual(conv)
  })
})

describe('deleteConversation', () => {
  it('calls DELETE /conversations/:id and returns undefined', async () => {
    vi.stubGlobal('fetch', mockFetch(204))
    const result = await deleteConversation('abc-123', TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations\/abc-123$/)
    expect(opts.method).toBe('DELETE')
    expect(result).toBeUndefined()
  })
})

describe('uploadFile', () => {
  it('calls POST /conversations/:id/upload with FormData', async () => {
    const conv = {
      id: '1', title: 'Doc', created_at: '2024-01-01',
      document: { id: 'd1', filename: 'doc.pdf', chunks_count: 5, uploaded_at: '2024-01-01' },
      messages: [],
    }
    vi.stubGlobal('fetch', mockFetch(200, conv))
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' })
    const result = await uploadFile('1', file, TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations\/1\/upload$/)
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(result).toEqual(conv)
  })
})

describe('askQuestion', () => {
  it('calls POST /conversations/:id/ask with question in JSON body', async () => {
    const answer = { question: 'What?', reponse: 'Because.' }
    vi.stubGlobal('fetch', mockFetch(200, answer))
    const result = await askQuestion('1', 'What?', TOKEN)
    const [url, opts] = (fetch as Mock).mock.calls[0]
    expect(url).toMatch(/\/conversations\/1\/ask$/)
    expect(opts.method).toBe('POST')
    expect(JSON.parse(opts.body as string)).toEqual({ question: 'What?' })
    expect(result).toEqual(answer)
  })
})
