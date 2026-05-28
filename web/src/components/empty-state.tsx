import { Bot, Sparkles } from "lucide-react";

interface EmptyStateProps {
  documentName: string;
  onSuggestionClick: (text: string) => void;
}

export function EmptyState({ documentName, onSuggestionClick }: EmptyStateProps) {
  const suggestions = [
    "Fais-moi un résumé complet de ce document",
    "Quels sont les chiffres clés mentionnés ?",
    "Quelles sont les conclusions principales ?"
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-0 px-6 max-w-4xl w-full mx-auto pt-12">
      <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-400/20 flex items-center justify-center">
        <Bot size={22} className="text-violet-400" />
      </div>

      <div className="text-center pb-8 pt-2">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
        <span className="bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent">
          Document analysé avec succès
        </span>
      </h1>
        <p className="text-sm text-white/40 mt-2">
          L'assistant est prêt à répondre à vos questions sur <br/>
          <span className="font-medium text-white/70">{documentName}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 w-full max-w-lg mt-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex items-center cursor-pointer gap-3 w-full text-left p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all group"
          >
            <Sparkles size={16} className="text-violet-400/60 group-hover:text-violet-400 transition-colors" />
            <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
              {suggestion}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}