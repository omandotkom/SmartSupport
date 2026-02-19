import { NextRequest, NextResponse } from "next/server";
import {
  MODEL_REGISTRY,
  isModelDownloaded,
  isModelDownloading,
  getDownloadProgress,
} from "@/lib/models";
import { getActiveModelIdAsync, loadModel } from "@/lib/llm";
import { prisma } from "@/lib/prisma";
import type { ModelInfo } from "@/types";

export async function GET() {
  const activeModelId = await getActiveModelIdAsync();

  const models: ModelInfo[] = MODEL_REGISTRY.map((entry) => {
    let status: ModelInfo["status"] = "not_downloaded";

    if (entry.id === activeModelId) {
      status = "active";
    } else if (isModelDownloading(entry.id)) {
      status = "downloading";
    } else if (isModelDownloaded(entry.id)) {
      status = "downloaded";
    }

    return {
      id: entry.id,
      label: entry.label,
      sizeGB: entry.sizeGB,
      ramGB: entry.ramGB,
      recommended: entry.recommended,
      status,
      downloadProgress: isModelDownloading(entry.id)
        ? getDownloadProgress(entry.id) ?? undefined
        : undefined,
    };
  });

  return NextResponse.json(models);
}

export async function PUT(req: NextRequest) {
  const { modelId } = await req.json();

  if (!modelId) {
    return NextResponse.json({ error: "modelId wajib diisi" }, { status: 400 });
  }

  const entry = MODEL_REGISTRY.find((m) => m.id === modelId);
  if (!entry) {
    return NextResponse.json({ error: "Model tidak ditemukan" }, { status: 404 });
  }

  if (!isModelDownloaded(modelId)) {
    return NextResponse.json(
      { error: "Model belum di-download" },
      { status: 400 }
    );
  }

  try {
    await loadModel(modelId);

    // Save active model to DB
    await prisma.appConfig.upsert({
      where: { key: "activeModel" },
      update: { value: modelId },
      create: { key: "activeModel", value: modelId },
    });

    return NextResponse.json({ success: true, activeModel: modelId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load model";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
