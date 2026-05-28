import { Bot } from 'lucide-react'

export function AuthLogo() {
  return (
    <div className="flex items-center justify-center gap-2.5 mb-8">
      <div className="w-8 h-8 rounded-[9px] bg-violet-500/15 border border-violet-400/25 flex items-center justify-center">
        <Bot size={15} className="text-violet-400" />
      </div>
      <span className="text-[15px] font-semibold text-white/88 tracking-[-0.01em]">Iris Gen IA</span>
      <span className="text-[10px] font-medium text-violet-500/70 bg-violet-500/10 border border-violet-500/20 rounded-[5px] px-1.5 py-0.5">
        Beta
      </span>
    </div>
  )
}
