import { useState, useEffect, useRef } from 'react'
import { Conversation } from '@/lib/types'
import { ChatMessage, TypingIndicator } from './chat-message'
import { InputBox } from './input-box'
import { EmptyState } from './empty-state'
import { FileDropzone } from './file-dropzone'
import { AnalysisLoader } from './analysis-loader'
import { FileText, MoreVertical } from 'lucide-react'

interface ChatAreaProps {
  conversation: Conversation | null
  showDropzone: boolean
  onSendMessage: (content: string) => void
  onFileUpload: (file: File) => void
  isTyping: boolean
  isUploading: boolean
}

export function ChatArea({
  conversation,
  showDropzone,
  onSendMessage,
  onFileUpload,
  isTyping,
  isUploading,
}: ChatAreaProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation?.messages, isTyping])

  const handleSend = () => {
    if (!input.trim() || !conversation) return
    onSendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (isUploading) return <AnalysisLoader />

  if (!conversation && !showDropzone) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0d0d] text-white/20 text-sm">
        Sélectionnez ou créez un document
      </div>
    )
  }

  if (showDropzone) return <FileDropzone onFileUpload={onFileUpload} />

  const isEmpty = conversation!.messages.length === 0

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0d]">
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.05] bg-[#0d0d0d]/80 backdrop-blur-md sticky top-1 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            <FileText size={14} className="text-blue-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white/90 truncate">
              {conversation!.document?.filename ?? conversation!.title}
            </span>
            <span className="text-[11px] text-white/40">
              {conversation!.document
                ? `${conversation!.document.chunks_count} chunks · Analysé et prêt`
                : 'En attente de document'}
            </span>
          </div>
        </div>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState
            documentName={conversation!.document?.filename ?? conversation!.title}
            onSuggestionClick={(text) => setInput(text)}
          />
        ) : (
          <div className="py-6 max-w-3xl mx-auto px-6 flex flex-col gap-6">
            {conversation!.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.05] px-6 pt-4 pb-5 bg-gradient-to-t from-[#0d0d0d] to-transparent">
        <div className="max-w-3xl mx-auto">
          <InputBox
            value={input}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={handleSend}
            placeholder="Posez une question sur le document…"
          />
          <p className="text-center text-[11px] text-white/20 mt-2">
            L'IA peut faire des erreurs. Vérifiez toujours les sources dans le document.
          </p>
        </div>
      </div>
    </div>
  )
}
