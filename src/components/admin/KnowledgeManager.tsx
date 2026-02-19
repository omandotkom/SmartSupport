"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { Upload, Trash2, FileText, Loader2, AlertCircle } from "lucide-react";

export function KnowledgeManager() {
  const { topics, isLoadingTopics, isUploading, fetchTopics, uploadKB, deleteTopic } =
    useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.name.endsWith(".txt")) {
      setError("Hanya file .txt yang diterima");
      return;
    }

    try {
      await uploadKB(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus topik "${title}"? Semua data terkait akan dihapus.`)) return;
    try {
      await deleteTopic(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus topik");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--muted-foreground)]">
        Upload file knowledge base (.txt) dengan format: baris pertama{" "}
        <code className="rounded bg-[var(--muted)] px-1 py-0.5 text-xs">[Judul Topik]</code>,
        baris selanjutnya berisi content.
      </p>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] p-6 hover:border-[var(--ring)] hover:bg-[var(--muted)] transition-colors"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">
              Mengupload dan memproses...
            </span>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-[var(--muted-foreground)]" />
            <span className="text-sm text-[var(--muted-foreground)]">
              Klik untuk upload file .txt
            </span>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleUpload}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Topics list */}
      {isLoadingTopics && topics.length === 0 ? (
        <div className="flex items-center justify-center p-4 text-sm text-[var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Memuat knowledge base...
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-lg border border-[var(--border)] p-6 text-center text-sm text-[var(--muted-foreground)]">
          Belum ada knowledge base. Upload file .txt untuk menambahkan.
        </div>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Knowledge Base ({topics.length} topik)
          </h3>
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3"
            >
              <FileText className="h-5 w-5 shrink-0 text-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{topic.title}</div>
                <div className="text-xs text-[var(--muted-foreground)]">
                  {topic.filename} &middot; {topic.chunks} chunks &middot;{" "}
                  {new Date(topic.createdAt).toLocaleDateString("id-ID")}
                </div>
              </div>
              <button
                onClick={() => handleDelete(topic.id, topic.title)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Hapus topik"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
