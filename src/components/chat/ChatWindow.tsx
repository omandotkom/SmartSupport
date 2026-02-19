"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { MessageBubble } from "./MessageBubble";
import { InputBar } from "./InputBar";
import { SourceReference } from "./SourceReference";
import { Bot, AlertTriangle } from "lucide-react";

interface ChatWindowProps {
  hasActiveModel: boolean;
}

export function ChatWindow({ hasActiveModel }: ChatWindowProps) {
  const {
    activeSessionId,
    messages,
    isStreaming,
    streamingContent,
    streamingSources,
    sendMessage,
  } = useChatStore();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  if (!activeSessionId) {
    return (
      <div className="flex flex-1 items-center justify-center text-[var(--muted-foreground)]">
        <div className="text-center">
          <Bot className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p className="text-lg font-medium">SmartSupport</p>
          <p className="text-sm">Pilih atau buat session baru untuk mulai chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {!hasActiveModel && (
        <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4" />
          <span>
            Belum ada model AI yang aktif.{" "}
            <a href="/admin" className="font-medium underline">
              Buka Admin
            </a>{" "}
            untuk mengaktifkan model.
          </span>
        </div>
      )}

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[75%]">
              <div className="rounded-lg bg-[var(--muted)] px-3 py-2 text-sm whitespace-pre-wrap">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-[var(--foreground)] animate-pulse ml-0.5" />
              </div>
              {streamingSources.length > 0 && (
                <SourceReference sources={streamingSources} />
              )}
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isStreaming && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-lg bg-[var(--muted)] px-3 py-2 text-sm">
              <span className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-[var(--muted-foreground)] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 rounded-full bg-[var(--muted-foreground)] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 rounded-full bg-[var(--muted-foreground)] animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <InputBar
        onSend={sendMessage}
        disabled={isStreaming || !hasActiveModel}
        placeholder={
          !hasActiveModel
            ? "Aktifkan model AI terlebih dahulu di halaman Admin..."
            : undefined
        }
      />
    </div>
  );
}
