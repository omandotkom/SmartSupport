import { NextResponse } from "next/server";
import { getActiveModelIdAsync } from "@/lib/llm";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const activeModel = await getActiveModelIdAsync();
  const topicsCount = await prisma.knowledgeTopic.count();

  return NextResponse.json({
    status: activeModel ? "ok" : "no_model",
    activeModel,
    topicsCount,
  });
}
