// components/chat/chat-message.tsx
import { Message } from "@/lib/types";
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

function AssistantAvatar() {
  return (
    <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-400/20 flex items-center justify-center shrink-0">
      <Bot size={13} className="text-violet-400" />
    </div>
  );
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
  );
}

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-end gap-3 w-full animate-msg-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && <AssistantAvatar />}

      <div
        className={cn(
          "max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-violet-800 text-violet-100 rounded-2xl rounded-br-sm"
            : "bg-[#1a1a1a] text-white/70 border border-white/[0.06] rounded-2xl rounded-bl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}