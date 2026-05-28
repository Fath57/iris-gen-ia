// components/chat/chat-message.tsx
import { Message } from '@/lib/types'
import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'

function AssistantAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-400/20 flex items-center justify-center shrink-0">
      <Bot size={13} className="text-violet-400" />
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 animate-msg-fade-in">
      <AssistantAvatar />
      <div className="flex items-center gap-1 px-4 py-3 bg-[#1a1a1a] border border-white/[0.06] rounded-2xl rounded-bl-sm w-fit">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/20 animate-typing-bounce"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex items-end gap-3 w-full animate-msg-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {!isUser && <AssistantAvatar />}

      <div
        className={cn(
          'max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-violet-800 text-violet-100 rounded-2xl rounded-br-sm'
            : 'bg-[#1a1a1a] text-white/70 border border-white/[0.06] rounded-2xl rounded-bl-sm'
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => (
                <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
              ),
              li: ({ children }) => <li>{children}</li>,
              code: ({ children, className }) =>
                className ? (
                  <pre className="bg-black/30 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-black/30 rounded px-1 py-0.5 text-xs font-mono">
                    {children}
                  </code>
                ),
              strong: ({ children }) => (
                <strong className="font-semibold text-white/90">{children}</strong>
              ),
              h1: ({ children }) => (
                <h1 className="text-base font-semibold text-white/90 mb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-semibold text-white/90 mb-1.5">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-sm font-medium text-white/80 mb-1">{children}</h3>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
