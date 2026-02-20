import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseKnowledgeFile, chunkText } from "@/lib/knowledge-loader";
import { addChunks } from "@/lib/vectorstore";

export async function GET() {
  const topics = await prisma.knowledgeTopic.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      filename: true,
      chunks: true,
      createdAt: true,
    },
  });

  return NextResponse.json(topics);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File wajib diupload" }, { status: 400 });
    }

    if (!file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Hanya file .txt yang diterima" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran file maksimal 10MB" },
        { status: 400 }
      );
    }

    const raw = await file.text();
    const { title, content } = parseKnowledgeFile(raw);

    // Check if topic already exists
    const existing = await prisma.knowledgeTopic.findUnique({
      where: { title },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Topik "${title}" sudah ada. Hapus dulu jika ingin mengupload ulang.` },
        { status: 409 }
      );
    }

    const parsedChunkSize = Number.parseInt(process.env.CHUNK_SIZE || "1000", 10);
    const parsedChunkOverlap = Number.parseInt(process.env.CHUNK_OVERLAP || "200", 10);
    const chunkSize =
      Number.isFinite(parsedChunkSize) && parsedChunkSize > 0
        ? parsedChunkSize
        : 1000;
    const chunkOverlap =
      Number.isFinite(parsedChunkOverlap) && parsedChunkOverlap >= 0
        ? parsedChunkOverlap
        : 200;

    if (chunkOverlap >= chunkSize) {
      return NextResponse.json(
        { error: "Konfigurasi chunk tidak valid: CHUNK_OVERLAP harus lebih kecil dari CHUNK_SIZE" },
        { status: 400 }
      );
    }

    const chunks = chunkText(content, chunkSize, chunkOverlap);

    // Save to database
    const topic = await prisma.knowledgeTopic.create({
      data: {
        title,
        filename: file.name,
        content,
        chunks: chunks.length,
      },
    });

    // Embed and store chunks in vector store
    await addChunks(topic.id, title, chunks);

    return NextResponse.json(
      {
        id: topic.id,
        title: topic.title,
        filename: topic.filename,
        chunks: topic.chunks,
        createdAt: topic.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Upload gagal";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
