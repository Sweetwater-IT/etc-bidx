"use client";

import * as React from "react";
import type { ChatResponse } from "@/lib/chat/types";
import { useChat } from "@/contexts/chat-context";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { ChatMessage as ChatMessageType } from "./ChatMessage";
import { ChatMessages } from "./ChatMessages";

const SESSION_STORAGE_KEY = "etc-bidx-chat-session-id";

function getOrCreateSessionId() {
  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const nextId = crypto.randomUUID();
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, nextId);
  return nextId;
}

export function ChatPanel() {
  const { isChatOpen, closeChat } = useChat();
  const [messages, setMessages] = React.useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const sessionIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined" && !sessionIdRef.current) {
      sessionIdRef.current = getOrCreateSessionId();
    }
  }, []);

  React.useEffect(() => {
    console.info("[chat] panel visibility changed", { isChatOpen });
  }, [isChatOpen]);

  const handleSend = async (message: string) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.info("[chat] sending message", {
        sessionId: sessionIdRef.current ?? "default",
        messagePreview: message.slice(0, 120),
      });

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          sessionId: sessionIdRef.current ?? "default",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = (await response.json()) as ChatResponse;
      console.info("[chat] received response", {
        messageId: data.message.id,
        role: data.message.role,
      });

      const assistantMessage: ChatMessageType = {
        id: data.message.id || crypto.randomUUID(),
        role: "assistant",
        content: data.message.content,
        timestamp: new Date(data.message.timestamp),
        proposal: data.pendingProposal,
        executedResult: data.executedResult,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("[chat] request failed", error);
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isChatOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={closeChat}
        aria-hidden="true"
      />

      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[440px] bg-background border-l z-50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out"
        role="dialog"
        aria-modal="true"
        aria-label="AI Assistant chat"
      >
        <ChatHeader />
        <ChatMessages messages={messages} isLoading={isLoading} />
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </>
  );
}
