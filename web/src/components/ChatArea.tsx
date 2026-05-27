import { useState, useEffect, useRef } from "react";
import { Chat } from "@/lib/types";
import { ChatMessage, TypingIndicator } from "./chat-message";
import { InputBox } from "./input-box";
import { EmptyState } from "./empty-state";
import { FileDropzone } from "./file-dropzone";
import { AnalysisLoader } from "./analysis-loader";
import { FileText, MoreVertical } from "lucide-react";

interface ChatAreaProps {
  chat: Chat | undefined;
  onSendMessage: (chatId: string, content: string) => void;
  onFileUpload: (chatId: string, file: File) => void;
  isTyping: boolean;
  isUploading: boolean;
}

export function ChatArea({ chat, onSendMessage, onFileUpload, isTyping, isUploading }: ChatAreaProps) {
  const [input, setInput] = useState<string>("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages, isTyping]);

  const handleSend = () => {
    if (!input.trim() || !chat) return;
    onSendMessage(chat.id, input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0d0d0d] text-white/20 text-sm">
        Sélectionnez ou créez un document
      </div>
    );
  }

  // 1. État : En cours d'analyse
  if (isUploading) return <AnalysisLoader />;

  // 2. État : En attente de document
  if (!chat.document) return <FileDropzone onFileUpload={(file) => onFileUpload(chat.id, file)} />;

  const isEmpty = chat.messages.length === 0;

  // 3. État : Document chargé (Chat interactif)
  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0d]">
      {/* Bannière du document */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/[0.05] bg-[#0d0d0d]/80 backdrop-blur-md sticky top-1 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20">
            <FileText size={14} className="text-blue-400" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-medium text-white/90 truncate">
              {chat.document.name}
            </span>
            <span className="text-[11px] text-white/40">
              {(chat.document.size / 1024 / 1024).toFixed(2)} MB • Analysé et prêt
            </span>
          </div>
        </div>
        <button className="p-1.5 rounded-md text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-colors">
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Zone principale (Messages ou Suggestions) */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyState 
            documentName={chat.document.name} 
            onSuggestionClick={(text) => {
              setInput(text);
              // Optionnel: Décommenter pour envoyer directement
              // onSendMessage(chat.id, text); 
            }} 
          />
        ) : (
          <div className="py-6 max-w-3xl mx-auto px-6 flex flex-col gap-6">
            {chat.messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Zone d'input */}
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
  );
}