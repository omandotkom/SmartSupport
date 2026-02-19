"use client";

import { create } from "zustand";
import type { ModelInfo, KnowledgeTopic, DownloadProgress } from "@/types";

interface AdminState {
  models: ModelInfo[];
  topics: KnowledgeTopic[];
  isLoadingModels: boolean;
  isLoadingTopics: boolean;
  isUploading: boolean;
  isActivating: boolean;
  downloadError: string | null;

  fetchModels: () => Promise<void>;
  downloadModel: (modelId: string) => Promise<void>;
  pollDownloadProgress: (modelId: string) => void;
  activateModel: (modelId: string) => Promise<void>;
  fetchTopics: () => Promise<void>;
  uploadKB: (file: File) => Promise<void>;
  deleteTopic: (id: string) => Promise<void>;
  clearDownloadError: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  models: [],
  topics: [],
  isLoadingModels: false,
  isLoadingTopics: false,
  isUploading: false,
  isActivating: false,
  downloadError: null,

  fetchModels: async () => {
    set({ isLoadingModels: true });
    try {
      const res = await fetch("/api/admin/models");
      const models = await res.json();
      set({ models });
    } finally {
      set({ isLoadingModels: false });
    }
  },

  downloadModel: async (modelId: string) => {
    const res = await fetch("/api/admin/models/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    // Update local status
    set((state) => ({
      models: state.models.map((m) =>
        m.id === modelId
          ? { ...m, status: "downloading" as const, downloadProgress: { modelId, percentage: 0, downloadedBytes: 0, totalBytes: 0 } }
          : m
      ),
    }));

    // Start polling
    get().pollDownloadProgress(modelId);
  },

  clearDownloadError: () => set({ downloadError: null }),

  pollDownloadProgress: (modelId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/models/download?modelId=${modelId}`);
        const data = await res.json();

        if (data.status === "error") {
          clearInterval(interval);
          set({ downloadError: data.error });
          await get().fetchModels();
          return;
        }

        if (data.status === "completed") {
          clearInterval(interval);
          await get().fetchModels();
          return;
        }

        if (data.status === "idle") {
          // Download belum mulai atau sudah selesai tanpa terdeteksi
          clearInterval(interval);
          await get().fetchModels();
          return;
        }

        set((state) => ({
          models: state.models.map((m) =>
            m.id === modelId
              ? {
                  ...m,
                  status: "downloading" as const,
                  downloadProgress: {
                    modelId,
                    percentage: data.percentage,
                    downloadedBytes: data.downloadedBytes,
                    totalBytes: data.totalBytes,
                  },
                }
              : m
          ),
        }));
      } catch {
        // Ignore transient polling errors
      }
    }, 1000);
  },

  activateModel: async (modelId: string) => {
    set({ isActivating: true });
    try {
      const res = await fetch("/api/admin/models", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      await get().fetchModels();
    } finally {
      set({ isActivating: false });
    }
  },

  fetchTopics: async () => {
    set({ isLoadingTopics: true });
    try {
      const res = await fetch("/api/admin/knowledge");
      const topics = await res.json();
      set({ topics });
    } finally {
      set({ isLoadingTopics: false });
    }
  },

  uploadKB: async (file: File) => {
    set({ isUploading: true });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/knowledge", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      await get().fetchTopics();
    } finally {
      set({ isUploading: false });
    }
  },

  deleteTopic: async (id: string) => {
    const res = await fetch(`/api/admin/knowledge/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }

    set((state) => ({
      topics: state.topics.filter((t) => t.id !== id),
    }));
  },
}));
