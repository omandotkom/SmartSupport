"use client";

import { useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import { Plus, Trash2, MessageSquare, Settings } from "lucide-react";

export function SessionList() {
  const {
    sessions,
    activeSessionId,
    fetchSessions,
    createSession,
    deleteSession,
    setActiveSession,
  } = useChatStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleNewSession = async () => {
    const title = `Case ${new Date().toLocaleDateString("id-ID")} ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`;
    await createSession(title);
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] p-3">
        <h2 className="text-sm font-semibold">Sessions</h2>
        <div className="flex gap-1">
          <a
            href="/admin"
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--muted)] transition-colors"
            title="Admin"
          >
            <Settings className="h-4 w-4" />
          </a>
          <button
            onClick={handleNewSession}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-[var(--muted)] transition-colors"
            title="Session Baru"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-xs text-[var(--muted-foreground)]">
            Belum ada session. Klik + untuk membuat baru.
          </div>
        ) : (
          <div className="p-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  activeSessionId === session.id
                    ? "bg-[var(--muted)] text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
                onClick={() => setActiveSession(session.id)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{session.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.id);
                  }}
                  className="hidden h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-[var(--destructive)] hover:text-[var(--destructive-foreground)] group-hover:flex transition-colors"
                  title="Hapus session"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
