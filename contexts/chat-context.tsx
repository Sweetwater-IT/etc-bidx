"use client";

import * as React from "react";

interface ChatContextType {
  isChatOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  previousSidebarState: "expanded" | "collapsed" | null;
  setPreviousSidebarState: (state: "expanded" | "collapsed" | null) => void;
}

const ChatContext = React.createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [previousSidebarState, setPreviousSidebarState] = React.useState<"expanded" | "collapsed" | null>(null);

  const openChat = React.useCallback(() => {
    setIsChatOpen(true);
  }, []);

  const closeChat = React.useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const toggleChat = React.useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        isChatOpen,
        openChat,
        closeChat,
        toggleChat,
        previousSidebarState,
        setPreviousSidebarState,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = React.useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
