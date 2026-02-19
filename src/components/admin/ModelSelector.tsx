"use client";

import { useEffect } from "react";
import { useAdminStore } from "@/stores/adminStore";
import { ModelDownloadProgress } from "./ModelDownloadProgress";
import { Download, Check, Loader2, Star, HardDrive, Cpu, AlertCircle, X } from "lucide-react";

export function ModelSelector() {
  const {
    models,
    isLoadingModels,
    isActivating,
    downloadError,
    fetchModels,
    downloadModel,
    activateModel,
    clearDownloadError,
  } = useAdminStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  if (isLoadingModels && models.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-[var(--muted-foreground)]">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Memuat daftar model...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--muted-foreground)]">
        Pilih dan aktifkan model AI untuk digunakan dalam chat. Model perlu di-download terlebih dahulu.
      </p>

      {/* Download error banner */}
      {downloadError && (
        <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium">Download gagal</div>
            <div className="text-xs mt-0.5">{downloadError}</div>
          </div>
          <button
            onClick={clearDownloadError}
            className="shrink-0 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {models.map((model) => (
          <div
            key={model.id}
            className={`rounded-lg border p-4 transition-colors ${
              model.status === "active"
                ? "border-green-300 bg-green-50"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm">{model.label}</h3>
                  {model.recommended && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <Star className="h-3 w-3" /> Recommended
                    </span>
                  )}
                  {model.status === "active" && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" /> {model.sizeGB} GB
                  </span>
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> RAM: {model.ramGB} GB
                  </span>
                </div>
              </div>

              <div className="ml-3 shrink-0">
                {model.status === "not_downloaded" && (
                  <button
                    onClick={() => downloadModel(model.id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                )}
                {model.status === "downloaded" && (
                  <button
                    onClick={() => activateModel(model.id)}
                    disabled={isActivating}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isActivating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Activate
                  </button>
                )}
                {model.status === "active" && (
                  <span className="text-xs text-green-600 font-medium">Aktif</span>
                )}
              </div>
            </div>

            {/* Download progress */}
            {model.status === "downloading" && model.downloadProgress && (
              <div className="mt-3">
                <ModelDownloadProgress progress={model.downloadProgress} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
