import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteByTopic } from "@/lib/vectorstore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const topic = await prisma.knowledgeTopic.findUnique({
    where: { id },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topik tidak ditemukan" }, { status: 404 });
  }

  return NextResponse.json(topic);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const topic = await prisma.knowledgeTopic.findUnique({
    where: { id },
  });

  if (!topic) {
    return NextResponse.json({ error: "Topik tidak ditemukan" }, { status: 404 });
  }

  // Delete vectors from Vectra
  await deleteByTopic(id);

  // Delete from database
  await prisma.knowledgeTopic.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
