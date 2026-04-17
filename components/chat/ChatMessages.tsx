"use client";

import * as React from "react";
import { ChatMessage, ChatMessage as ChatMessageType } from "./ChatMessage";

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-muted-foreground text-sm">
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
      <span>Thinking...</span>
    </div>
  );
}

export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M12 8V4H8" />
            <rect width="16" height="12" x="4" y="8" rx="2" />
            <path d="M2 14h2" />
            <path d="M20 14h2" />
            <path d="M15 13v2" />
            <path d="M9 13v2" />
          </svg>
        </div>
        <h3 className="font-medium text-sm mb-1">Welcome to AI Assistant</h3>
        <p className="text-xs text-muted-foreground max-w-[240px]">
          Ask me anything about bids, jobs, contracts, customers, quotes, or sign orders.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-center py-2">
          <ThinkingIndicator />
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
