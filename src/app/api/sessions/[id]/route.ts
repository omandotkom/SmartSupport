import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session tidak ditemukan" }, { status: 404 });
  }

  // Parse sources JSON for each message
  const messages = session.messages.map((m) => ({
    ...m,
    sources: m.sources ? JSON.parse(m.sources) : null,
  }));

  return NextResponse.json({ ...session, messages });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await prisma.session.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Session tidak ditemukan" }, { status: 404 });
  }
}
