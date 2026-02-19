import path from "node:path";
import { embedText } from "./embeddings";

const dataDir = process.env.DATA_DIR || "./data";
const indexPath = path.join(dataDir, "vectra_index");

let indexInstance: unknown = null;

async function getIndex() {
  if (indexInstance) return indexInstance as import("vectra").LocalIndex;

  const { LocalIndex } = await import("vectra");
  const index = new LocalIndex(indexPath);

  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }

  indexInstance = index;
  return index;
}

export interface ChunkItem {
  text: string;
  topicId: string;
  topicTitle: string;
}

export interface SearchResult {
  text: string;
  topicId: string;
  topicTitle: string;
  score: number;
}

export async function addChunks(
  topicId: string,
  topicTitle: string,
  chunks: string[]
): Promise<void> {
  const index = await getIndex();

  for (const chunk of chunks) {
    const vector = await embedText(chunk);
    await index.insertItem({
      vector,
      metadata: {
        text: chunk,
        topicId,
        topicTitle,
      },
    });
  }
}

export async function searchChunks(
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  const index = await getIndex();
  const queryVector = await embedText(query);
  const results = await index.queryItems(queryVector, topK);

  return results.map((r) => ({
    text: r.item.metadata.text as string,
    topicId: r.item.metadata.topicId as string,
    topicTitle: r.item.metadata.topicTitle as string,
    score: r.score,
  }));
}

export async function deleteByTopic(topicId: string): Promise<void> {
  const index = await getIndex();
  const items = await index.listItems();

  for (const item of items) {
    if (item.metadata.topicId === topicId) {
      await index.deleteItem(item.id);
    }
  }
}
