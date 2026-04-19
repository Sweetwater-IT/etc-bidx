"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
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
    <Button
      type="button"
      variant={isChatOpen ? "secondary" : "outline"}
      size="sm"
      onClick={handleClick}
      className="h-8 gap-1.5"
      aria-pressed={isChatOpen}
      aria-label={isChatOpen ? "Close AI assistant" : "Open AI assistant"}
    >
      <Sparkles className="h-3.5 w-3.5" />
      AI
    </Button>
  );
}
