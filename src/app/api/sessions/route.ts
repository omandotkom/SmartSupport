import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.session.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const { title } = await req.json();

  if (!title) {
    return NextResponse.json({ error: "Title wajib diisi" }, { status: 400 });
  }

  const session = await prisma.session.create({
    data: { title },
  });

  return NextResponse.json(session, { status: 201 });
}
