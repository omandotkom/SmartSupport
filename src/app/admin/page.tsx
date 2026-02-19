"use client";

import { useState } from "react";
import { ModelSelector } from "@/components/admin/ModelSelector";
import { KnowledgeManager } from "@/components/admin/KnowledgeManager";
import { ArrowLeft, Cpu, BookOpen } from "lucide-react";

type Tab = "models" | "knowledge";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("models");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-4xl px-4 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--muted)] transition-colors"
              title="Kembali ke Chat"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            <div>
              <h1 className="text-lg font-semibold">Admin</h1>
              <p className="text-xs text-[var(--muted-foreground)]">
                Konfigurasi model AI dan knowledge base
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex gap-0">
            <button
              onClick={() => setActiveTab("models")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "models"
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <Cpu className="h-4 w-4" />
              Model Management
            </button>
            <button
              onClick={() => setActiveTab("knowledge")}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "knowledge"
                  ? "border-[var(--primary)] text-[var(--foreground)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Knowledge Base
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {activeTab === "models" ? <ModelSelector /> : <KnowledgeManager />}
      </main>
    </div>
  );
}
