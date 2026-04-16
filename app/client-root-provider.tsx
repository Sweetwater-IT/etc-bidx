"use client";
import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { ChatPanel } from "@/components/chat/ChatPanel";

export default function ClientRootProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        {children}
        <ChatPanel />
      </ChatProvider>
    </AuthProvider>
  );
} 
