// components/chat/input-box.tsx
import { useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button"; // Ton composant shadcn

interface InputBoxProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
  placeholder: string;
}

const MAX_TEXTAREA_HEIGHT = 160;

export function InputBox({
  value,
  onChange,
  onKeyDown,
  onSend,
  placeholder,
}: InputBoxProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0;

  // Gestion automatique de la hauteur interne
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  return (
    <div className="relative w-full mx-auto flex items-end bg-[#1a1a1a] border border-white/[0.08] rounded-2xl px-4 py-3 pr-12 focus-within:border-white/20 transition-colors max-w-xl">
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none resize-none text-white/80 placeholder:text-white/20 text-sm leading-relaxed max-h-40 overflow-y-auto  max-w-xl"
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={!canSend}
        className="absolute right-3 bottom-2 w-8 h-8 rounded-lg bg-violet-700 text-white hover:bg-violet-600 disabled:bg-white/[0.04] disabled:text-white/20"
      >
        <Send size={12} />
      </Button>
    </div>
  );
}