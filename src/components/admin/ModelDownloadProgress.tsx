"use client";

import type { DownloadProgress } from "@/types";

interface ModelDownloadProgressProps {
  progress: DownloadProgress;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function ModelDownloadProgress({ progress }: ModelDownloadProgressProps) {
  return (
    <div className="space-y-1">
      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-[var(--muted)]">
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>

      {/* Progress text */}
      <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
        <span>{progress.percentage}%</span>
        <span>
          {formatBytes(progress.downloadedBytes)}
          {progress.totalBytes > 0 && ` / ${formatBytes(progress.totalBytes)}`}
        </span>
      </div>
    </div>
  );
}
