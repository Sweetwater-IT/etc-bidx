"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@/contexts/chat-context";

export function ChatHeader() {
  const { closeChat } = useChat();

  return (
    <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
      <div className="flex flex-col">
        <h2 className="font-semibold text-sm">AI Assistant</h2>
        <p className="text-xs text-muted-foreground">ETC-BIDX Helper</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={closeChat}
        aria-label="Close chat"
        className="h-8 w-8"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
