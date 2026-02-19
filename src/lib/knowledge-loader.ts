export interface ParsedKnowledge {
  title: string;
  content: string;
}

export function parseKnowledgeFile(raw: string): ParsedKnowledge {
  const lines = raw.trim().split("\n");
  if (lines.length === 0) {
    throw new Error("File is empty");
  }

  const firstLine = lines[0].trim();
  const titleMatch = firstLine.match(/^\[(.+)\]$/);
  if (!titleMatch) {
    throw new Error("Baris pertama harus format [Judul Topik]");
  }

  const title = titleMatch[1].trim();
  const content = lines.slice(1).join("\n").trim();

  if (!content) {
    throw new Error("Content knowledge base tidak boleh kosong");
  }

  return { title, content };
}

export function chunkText(
  text: string,
  chunkSize: number = 1000,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];

  if (text.length <= chunkSize) {
    chunks.push(text);
    return chunks;
  }

  let start = 0;
  while (start < text.length) {
    let end = start + chunkSize;
    if (end > text.length) {
      end = text.length;
    }

    // Try to break at a sentence/paragraph boundary
    if (end < text.length) {
      const breakPoints = ["\n\n", "\n", ". ", ", ", " "];
      for (const bp of breakPoints) {
        const lastBreak = text.lastIndexOf(bp, end);
        if (lastBreak > start + chunkSize / 2) {
          end = lastBreak + bp.length;
          break;
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start < 0) start = 0;

    // Avoid infinite loop if overlap >= chunkSize
    if (start >= end) break;
  }

  return chunks.filter((c) => c.length > 0);
}
