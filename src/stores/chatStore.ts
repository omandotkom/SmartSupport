"use client";

import { create } from "zustand";
import type { ChatSession, ChatMessage, SourceReference } from "@/types";

async function parseJsonOrNull<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  return JSON.parse(text) as T;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  streamingSources: SourceReference[];

  fetchSessions: () => Promise<void>;
  createSession: (title: string) => Promise<ChatSession>;
  deleteSession: (id: string) => Promise<void>;
  setActiveSession: (id: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  isStreaming: false,
  streamingContent: "",
  streamingSources: [],

  fetchSessions: async () => {
    try {
      const res = await fetch("/api/sessions");
      const sessions = await parseJsonOrNull<ChatSession[]>(res);

      if (!res.ok) {
        throw new Error("Failed to load sessions");
      }

      set({ sessions: Array.isArray(sessions) ? sessions : [] });
    } catch {
      set({ sessions: [] });
    }
  },

  createSession: async (title: string) => {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    const session = await parseJsonOrNull<ChatSession>(res);

    if (!res.ok || !session) {
      throw new Error("Failed to create session");
    }

    set((state) => ({ sessions: [session, ...state.sessions] }));
    await get().setActiveSession(session.id);
    return session;
  },

  deleteSession: async (id: string) => {
    await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    set((state) => {
      const sessions = state.sessions.filter((s) => s.id !== id);
      const activeSessionId =
        state.activeSessionId === id
          ? sessions[0]?.id || null
          : state.activeSessionId;
      return { sessions, activeSessionId, messages: activeSessionId === state.activeSessionId ? state.messages : [] };
    });

    const { activeSessionId } = get();
    if (activeSessionId) {
      await get().setActiveSession(activeSessionId);
    }
  },

  setActiveSession: async (id: string) => {
    set({ activeSessionId: id, messages: [], streamingContent: "", streamingSources: [] });
    const res = await fetch(`/api/sessions/${id}`);
    if (res.ok) {
      const data = await parseJsonOrNull<{ messages?: ChatMessage[] }>(res);
      set({ messages: data?.messages ?? [] });
    }
  },

  sendMessage: async (message: string) => {
    const { activeSessionId } = get();
    if (!activeSessionId) return;

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      sessionId: activeSessionId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, userMsg],
      isStreaming: true,
      streamingContent: "",
      streamingSources: [],
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: activeSessionId, message }),
      });

      if (!res.ok) {
        const err = await parseJsonOrNull<{ error?: string }>(res);
        throw new Error(err?.error || "Chat request failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let sources: SourceReference[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = JSON.parse(line.slice(6));

          if (data.type === "sources") {
            sources = data.sources;
            set({ streamingSources: sources });
          } else if (data.type === "text") {
            fullContent += data.text;
            set({ streamingContent: fullContent });
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        }
      }

      // Replace streaming with final message
      const assistantMsg: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: fullContent,
        sources,
        sessionId: activeSessionId,
        createdAt: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isStreaming: false,
        streamingContent: "",
        streamingSources: [],
      }));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      const errorAssistantMsg: ChatMessage = {
        id: `temp-error-${Date.now()}`,
        role: "assistant",
        content: `Error: ${errorMsg}`,
        sessionId: activeSessionId,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorAssistantMsg],
        isStreaming: false,
        streamingContent: "",
      }));
    }
  },
}));
