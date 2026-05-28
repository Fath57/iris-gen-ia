import './App.css'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { useConversations } from './lib/hooks/useConversations'

export default function App() {
  const {
    conversations,
    activeConversation,
    pendingNew,
    isUploading,
    isTyping,
    startNew,
    selectConversation,
    createAndUpload,
    sendMessage,
    deleteConversation,
  } = useConversations()

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] font-sans">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onSelectConversation={selectConversation}
        onNewConversation={startNew}
        onDeleteConversation={deleteConversation}
      />
      <ChatArea
        conversation={activeConversation}
        showDropzone={pendingNew}
        onSendMessage={sendMessage}
        onFileUpload={createAndUpload}
        isTyping={isTyping}
        isUploading={isUploading}
      />
    </div>
  )
}
