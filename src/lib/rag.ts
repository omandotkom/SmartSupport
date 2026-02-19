import { searchChunks, type SearchResult } from "./vectorstore";
import { generateStream } from "./llm";

export interface RagSource {
  topicId: string;
  topicTitle: string;
  snippet: string;
}

const SYSTEM_PROMPT_TEMPLATE = `Kamu adalah asisten support yang membantu tim Application Support menyelesaikan masalah user.
Jawab pertanyaan HANYA berdasarkan konteks dokumen yang diberikan.
Jika informasi tidak ada di dokumen, katakan dengan jelas bahwa kamu tidak menemukan informasi tersebut di knowledge base.
Berikan jawaban yang terstruktur dan actionable.
Sebutkan topik sumber informasi jika memungkinkan.

Konteks Dokumen:
{context}`;

function buildContext(results: SearchResult[]): string {
  return results
    .map((r) => `---\nTopik: ${r.topicTitle}\n${r.text}\n---`)
    .join("\n\n");
}

function deduplicateSources(results: SearchResult[]): RagSource[] {
  const seen = new Set<string>();
  const sources: RagSource[] = [];

  for (const r of results) {
    if (!seen.has(r.topicId)) {
      seen.add(r.topicId);
      sources.push({
        topicId: r.topicId,
        topicTitle: r.topicTitle,
        snippet: r.text.slice(0, 200) + (r.text.length > 200 ? "..." : ""),
      });
    }
  }

  return sources;
}

export async function ragQuery(
  question: string,
  topK: number = 5
): Promise<{ stream: AsyncGenerator<string, void, unknown>; sources: RagSource[] }> {
  const results = await searchChunks(question, topK);

  const context = buildContext(results);
  const systemPrompt = SYSTEM_PROMPT_TEMPLATE.replace("{context}", context);
  const sources = deduplicateSources(results);

  const stream = generateStream(systemPrompt, question);

  return { stream, sources };
}
