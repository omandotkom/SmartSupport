"use client";

import { User, Bot } from "lucide-react";
import type { ChatMessage } from "@/types";
import { SourceReference } from "./SourceReference";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
            isUser
              ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "bg-[var(--muted)] text-[var(--foreground)]"
          }`}
        >
          {message.content}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <SourceReference sources={message.sources} />
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--secondary-foreground)]">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
