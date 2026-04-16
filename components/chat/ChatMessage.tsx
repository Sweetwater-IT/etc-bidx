"use client";

import Link from "next/link";
import type { ToolExecutionResult, ToolProposal } from "@/lib/chat/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  proposal?: ToolProposal | null;
  executedResult?: ToolExecutionResult;
}

interface ChatMessageProps {
  message: ChatMessage;
}

function ProposalCard({ proposal }: { proposal: ToolProposal }) {
  return (
    <div className="mt-3 rounded-xl border bg-background/80 p-3 text-xs">
      <div className="font-semibold">
        {proposal.operation.toUpperCase()} {proposal.entityType.replace(/_/g, " ")}
      </div>
      <div className="mt-1 text-muted-foreground">{proposal.summary}</div>
      {proposal.fields.length > 0 ? (
        <div className="mt-2 space-y-1">
          {proposal.fields.map((field) => (
            <div key={field.key} className="flex gap-2">
              <span className="min-w-0 font-medium">{field.label}:</span>
              <span className="min-w-0 break-words text-muted-foreground">{String(field.value ?? "[empty]")}</span>
            </div>
          ))}
        </div>
      ) : null}
      {proposal.missingFields.length > 0 ? (
        <div className="mt-2 text-amber-700">Missing: {proposal.missingFields.join(", ")}</div>
      ) : (
        <div className="mt-2 text-emerald-700">Ready to confirm</div>
      )}
    </div>
  );
}

function ResultCard({ result }: { result: ToolExecutionResult }) {
  const items = Array.isArray((result.data as { items?: unknown[] } | undefined)?.items)
    ? ((result.data as {
        items: Array<{ id: string; label: string; targetPath?: string }>;
      }).items)
    : [];

  return (
    <div className="mt-3 rounded-xl border bg-background/80 p-3 text-xs">
      <div className="font-semibold">
        {result.success ? "Execution complete" : "Execution failed"}
      </div>
      <div className="mt-1 text-muted-foreground">{result.summary}</div>
      {result.recordId ? <div className="mt-2">Record ID: {result.recordId}</div> : null}
      {result.targetPath ? (
        <div className="mt-3">
          <Link
            href={result.targetPath}
            className="inline-flex rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
          >
            Open record
          </Link>
        </div>
      ) : null}
      {!result.targetPath && items.some((item) => item.targetPath) ? (
        <div className="mt-3 space-y-2">
          {items
            .filter((item) => item.targetPath)
            .slice(0, 5)
            .map((item) => (
              <div key={item.id}>
                <Link
                  href={item.targetPath!}
                  className="inline-flex rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted"
                >
                  Open {item.label}
                </Link>
              </div>
            ))}
        </div>
      ) : null}
      {result.error ? <div className="mt-2 text-red-700">{result.error}</div> : null}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.proposal ? <ProposalCard proposal={message.proposal} /> : null}
        {!isUser && message.executedResult ? <ResultCard result={message.executedResult} /> : null}
        <p
          className={`text-[10px] mt-1 ${
            isUser ? "text-primary-foreground/60" : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
