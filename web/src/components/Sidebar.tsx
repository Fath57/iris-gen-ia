import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, LogOut, FileText, Bot, Trash2 } from 'lucide-react'
import { Conversation } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'

interface SidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
}

interface ConvGroup {
  label: string
  items: Conversation[]
}

function groupConversations(convs: Conversation[]): ConvGroup[] {
  const now = new Date()
  const today: Conversation[] = []
  const yesterday: Conversation[] = []
  const older: Conversation[] = []

  for (const conv of convs) {
    const diffDays = (now.getTime() - new Date(conv.created_at).getTime()) / 86_400_000
    if (diffDays < 1) today.push(conv)
    else if (diffDays < 2) yesterday.push(conv)
    else older.push(conv)
  }

  return [
    { label: "Aujourd'hui", items: today },
    { label: 'Hier', items: yesterday },
    { label: 'Plus ancien', items: older },
  ]
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: SidebarProps) {
  const groups = groupConversations(conversations)
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col w-64 shrink-0 h-full bg-[#111111] border-r border-white/[0.06]">
      <div className="flex items-center justify-between px-3.5 py-2.5 mb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-violet-500/15 border border-violet-400/25 flex items-center justify-center shrink-0">
            <Bot size={13} className="text-violet-400" />
          </div>
          <span className="text-[14px] font-medium text-white/88 tracking-[-0.01em]">
            DocuBot AI
          </span>
        </div>
        <span className="text-[10px] font-medium text-violet-500/70 bg-violet-500/10 border border-violet-500/20 rounded-[5px] px-1.5 py-0.5">
          Beta
        </span>
      </div>

      <div className="px-2.5 pb-4">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-violet-500/10 border border-violet-400/20 text-violet-300 text-[13.5px] font-medium hover:bg-violet-500/20 transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Nouveau document
        </button>
      </div>

      <ScrollArea className="flex-1 px-1.5">
        <div className="py-1 space-y-5">
          {groups.map(({ label, items }) =>
            items.length === 0 ? null : (
              <div key={label}>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/20 px-2.5 mb-1">
                  {label}
                </p>
                <div className="flex flex-col gap-px">
                  {items.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group flex items-center gap-1 px-2.5 py-2 rounded-lg transition-colors ${
                        activeConversationId === conv.id
                          ? 'bg-white/[0.08] text-white/90'
                          : 'text-white/40 hover:bg-white/[0.04] hover:text-white/60'
                      }`}
                    >
                      <button
                        onClick={() => onSelectConversation(conv.id)}
                        className="flex items-center gap-2.5 flex-1 min-w-0 text-[13.5px] text-left font-medium cursor-pointer"
                      >
                        <FileText
                          size={13}
                          className={`shrink-0 ${conv.document ? 'text-blue-400/60' : 'opacity-40'}`}
                        />
                        <span className="truncate">{conv.title}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteConversation(conv.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </ScrollArea>

      <div className="p-2.5 border-t border-white/[0.05]">
        <div className="flex items-center gap-2.5 px-2.5 py-[9px] rounded-[10px] border border-white/[0.06] bg-[#161616] hover:border-white/[0.11] transition-colors">
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-[10px] font-semibold tracking-wide text-white shrink-0">
            {user?.email?.slice(0, 2).toUpperCase() ?? '??'}
          </div>
          <div className="flex flex-col gap-px items-start flex-1 min-w-0 overflow-hidden">
            <span className="text-[13px] font-medium text-white/90 truncate leading-[1.3]">
              {user?.email ?? 'Inconnu'}
            </span>
            <div className="flex items-center gap-1">
              <div className="w-[5px] h-[5px] rounded-full bg-violet-500/50 shrink-0" />
              <span className="text-[10.5px] text-white/30 leading-none">Plan gratuit</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white/25 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer shrink-0"
            title="Se déconnecter"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
