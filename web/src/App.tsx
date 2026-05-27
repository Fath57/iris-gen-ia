import './App.css' 
import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { Chat, Message } from "./lib/types";

export default function App() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "Nouvelle analyse",
      updatedAt: new Date(),
      messages: [],
      // Pas de document initialisé, donc ça affichera la Dropzone
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleFileUpload = (chatId: string, file: File) => {
    setIsUploading(true);
    
    // Simulation du temps de traitement backend (ex: vectorisation)
    setTimeout(() => {
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          return {
            ...chat,
            title: file.name, // Le nom du document devient le titre du chat
            document: {
              name: file.name,
              size: file.size,
              type: file.type,
            },
          };
        })
      );
      setIsUploading(false);
    }, 3500); // 3.5 secondes pour voir le joli loader d'analyse
  };

  const handleSendMessage = (chatId: string, content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== chatId) return chat;
        return {
          ...chat,
          updatedAt: new Date(),
          messages: [...chat.messages, userMessage],
        };
      })
    );

    setIsTyping(true);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `D'après le document analysé, voici les informations concernant : "${content}".`,
        citations: ["Page 2"] // Simulation d'une citation
      };
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== chatId) return chat;
          return { ...chat, messages: [...chat.messages, botMessage] };
        })
      );
      setIsTyping(false);
    }, 1500);
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen w-full bg-[#0d0d0d] font-sans">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
      />
      <ChatArea
        chat={activeChat}
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        isTyping={isTyping}
        isUploading={isUploading}
      />
    </div>
  );
}