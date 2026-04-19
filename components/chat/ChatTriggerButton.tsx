"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useChat } from "@/contexts/chat-context";

interface ChatTriggerButtonProps {
  source: string;
}

export function ChatTriggerButton({ source }: ChatTriggerButtonProps) {
  const pathname = usePathname();
  const { isChatOpen, toggleChat } = useChat();

  const handleClick = React.useCallback(() => {
    const nextState = !isChatOpen;
    toggleChat();

    void fetch("/api/chat/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pathname,
        nextState,
        source,
      }),
    }).catch(() => {
      // Ignore telemetry failures.
    });
  }, [isChatOpen, pathname, source, toggleChat]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`rounded-lg p-2 transition-colors hover:bg-muted ${
        isChatOpen ? "bg-muted text-foreground" : "text-foreground"
      }`}
      aria-pressed={isChatOpen}
      aria-label={isChatOpen ? "Close AI assistant" : "Open AI assistant"}
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}
