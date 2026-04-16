"use client";
import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";

export default function ClientRootProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ChatProvider>
        {children}
      </ChatProvider>
    </AuthProvider>
  );
} 
