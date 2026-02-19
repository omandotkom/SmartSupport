import { NextRequest, NextResponse } from "next/server";
import {
  MODEL_REGISTRY,
  downloadModel,
  getDownloadProgress,
  getDownloadError,
  clearDownloadError,
  isModelDownloading,
  isModelDownloaded,
} from "@/lib/models";

export async function POST(req: NextRequest) {
  const { modelId } = await req.json();

  if (!modelId) {
    return NextResponse.json({ error: "modelId wajib diisi" }, { status: 400 });
  }

  const entry = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (!entry) {
    return NextResponse.json({ error: "Model tidak ditemukan" }, { status: 404 });
  }

  if (isModelDownloaded(modelId)) {
    return NextResponse.json({ error: "Model sudah di-download" }, { status: 400 });
  }

  if (isModelDownloading(modelId)) {
    return NextResponse.json({ error: "Model sedang di-download" }, { status: 400 });
  }

  // Clear any previous error
  clearDownloadError(modelId);

  // Start download in background (don't await)
  downloadModel(modelId).catch((err) => {
    console.error(`Failed to download model ${modelId}:`, err);
  });

  return NextResponse.json({ success: true, message: "Download dimulai" });
}

export async function GET(req: NextRequest) {
  const modelId = req.nextUrl.searchParams.get("modelId");

  if (!modelId) {
    return NextResponse.json({ error: "modelId parameter wajib" }, { status: 400 });
  }

  // Check for errors first
  const downloadError = getDownloadError(modelId);
  if (downloadError) {
    return NextResponse.json({
      modelId,
      status: "error",
      error: downloadError,
      percentage: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    });
  }

  if (isModelDownloaded(modelId) && !isModelDownloading(modelId)) {
    return NextResponse.json({
      modelId,
      status: "completed",
      percentage: 100,
      downloadedBytes: 0,
      totalBytes: 0,
    });
  }

  const progress = getDownloadProgress(modelId);
  if (!progress) {
    return NextResponse.json({
      modelId,
      status: "idle",
      percentage: 0,
      downloadedBytes: 0,
      totalBytes: 0,
    });
  }

  return NextResponse.json({
    ...progress,
    status: isModelDownloading(modelId) ? "downloading" : "completed",
  });
}
