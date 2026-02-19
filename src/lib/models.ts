import fs from "node:fs";
import path from "node:path";

export interface ModelEntry {
  id: string;
  label: string;
  huggingFaceUri: string;
  sizeGB: number;
  ramGB: number;
  recommended: boolean;
}

export type ModelStatus = "not_downloaded" | "downloading" | "downloaded" | "active";

export interface DownloadProgress {
  modelId: string;
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
}

export const MODEL_REGISTRY: ModelEntry[] = [
  {
    id: "qwen2.5-7b",
    label: "Qwen 2.5 7B",
    huggingFaceUri: "hf:Qwen/Qwen2.5-7B-Instruct-GGUF:q4_k_m",
    sizeGB: 4.7,
    ramGB: 6,
    recommended: true,
  },
  {
    id: "deepseek-r1-7b",
    label: "DeepSeek R1 Distill 7B",
    huggingFaceUri: "hf:bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF:Q4_K_M",
    sizeGB: 4.7,
    ramGB: 6,
    recommended: false,
  },
  {
    id: "llama3.1-8b",
    label: "Llama 3.1 8B",
    huggingFaceUri: "hf:bartowski/Meta-Llama-3.1-8B-Instruct-GGUF:Q4_K_M",
    sizeGB: 4.7,
    ramGB: 6,
    recommended: false,
  },
  {
    id: "phi4-mini",
    label: "Phi-4 Mini 3.8B",
    huggingFaceUri: "hf:bartowski/microsoft_Phi-4-mini-instruct-GGUF:Q4_K_M",
    sizeGB: 2.5,
    ramGB: 4,
    recommended: false,
  },
];

const dataDir = process.env.DATA_DIR || "./data";
const modelsDir = path.resolve(dataDir, "models");

// Maps modelId -> actual filename on disk (persisted in a manifest file)
const manifestPath = path.resolve(modelsDir, "manifest.json");

function loadManifest(): Record<string, string> {
  try {
    if (fs.existsSync(manifestPath)) {
      return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    }
  } catch {
    // Ignore corrupt manifest
  }
  return {};
}

function saveManifest(manifest: Record<string, string>): void {
  ensureModelsDir();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// In-memory download progress tracking
const downloadProgressMap = new Map<string, DownloadProgress>();
const activeDownloads = new Set<string>();
const downloadErrors = new Map<string, string>();

export function getDownloadError(modelId: string): string | null {
  return downloadErrors.get(modelId) || null;
}

export function clearDownloadError(modelId: string): void {
  downloadErrors.delete(modelId);
}

function ensureModelsDir(): void {
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }
}

export function getModelsDir(): string {
  ensureModelsDir();
  return modelsDir;
}

export function getModelFilePath(modelId: string): string | null {
  const manifest = loadManifest();
  const filename = manifest[modelId];
  if (!filename) return null;
  return path.join(getModelsDir(), filename);
}

export function isModelDownloaded(modelId: string): boolean {
  const filePath = getModelFilePath(modelId);
  if (!filePath) return false;
  return fs.existsSync(filePath);
}

export function isModelDownloading(modelId: string): boolean {
  return activeDownloads.has(modelId);
}

export function getDownloadProgress(modelId: string): DownloadProgress | null {
  return downloadProgressMap.get(modelId) || null;
}

export async function downloadModel(modelId: string): Promise<void> {
  const entry = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (!entry) throw new Error(`Model not found: ${modelId}`);
  if (activeDownloads.has(modelId)) throw new Error(`Model already downloading: ${modelId}`);
  if (isModelDownloaded(modelId)) throw new Error(`Model already downloaded: ${modelId}`);

  activeDownloads.add(modelId);
  downloadErrors.delete(modelId);
  downloadProgressMap.set(modelId, {
    modelId,
    percentage: 0,
    downloadedBytes: 0,
    totalBytes: 0,
  });

  try {
    const { createModelDownloader } = await import("node-llama-cpp");
    const dir = getModelsDir();

    const downloader = await createModelDownloader({
      modelUri: entry.huggingFaceUri,
      dirPath: dir,
      onProgress: ({ downloadedSize, totalSize }) => {
        const percentage = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
        downloadProgressMap.set(modelId, {
          modelId,
          percentage,
          downloadedBytes: downloadedSize,
          totalBytes: totalSize,
        });
      },
    });

    const totalBytes = downloader.totalSize;

    downloadProgressMap.set(modelId, {
      modelId,
      percentage: 0,
      downloadedBytes: 0,
      totalBytes,
    });

    const modelPath = await downloader.download();

    // Save the actual filename to manifest
    const actualFilename = path.basename(modelPath);
    const manifest = loadManifest();
    manifest[modelId] = actualFilename;
    saveManifest(manifest);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Download gagal";
    downloadErrors.set(modelId, errorMsg);
    downloadProgressMap.delete(modelId);
    throw err;
  } finally {
    activeDownloads.delete(modelId);
  }
}

export function findModelEntry(modelId: string): ModelEntry | undefined {
  return MODEL_REGISTRY.find((m) => m.id === modelId);
}
