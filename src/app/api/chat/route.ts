import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ragQuery } from "@/lib/rag";
import { getActiveModelIdAsync } from "@/lib/llm";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json();

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "sessionId dan message wajib diisi" },
        { status: 400 }
      );
    }

    if (!(await getActiveModelIdAsync())) {
      return NextResponse.json(
        { error: "Belum ada model yang aktif. Silakan aktifkan model di halaman Admin." },
        { status: 503 }
      );
    }

    // Verify session exists
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) {
      return NextResponse.json({ error: "Session tidak ditemukan" }, { status: 404 });
    }

    // Save user message
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        sessionId,
      },
    });

    const topK = parseInt(process.env.TOP_K_RESULTS || "5", 10);
    const { stream: ragStream, sources } = await ragQuery(message, topK);

    let fullResponse = "";

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // Send sources first as a JSON event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`)
          );

          for await (const chunk of ragStream) {
            fullResponse += chunk;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`)
            );
          }

          // Save assistant message to DB
          await prisma.message.create({
            data: {
              role: "assistant",
              content: fullResponse,
              sources: JSON.stringify(sources),
              sessionId,
            },
          });

          // Update session timestamp
          await prisma.session.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
          );
          controller.close();
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
