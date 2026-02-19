type Pipeline = (text: string | string[], options?: Record<string, unknown>) => Promise<{ data: Float32Array; dims: number[] }>;

let pipelineInstance: Pipeline | null = null;
let pipelineLoading: Promise<Pipeline> | null = null;

async function getPipeline(): Promise<Pipeline> {
  if (pipelineInstance) return pipelineInstance;

  if (!pipelineLoading) {
    pipelineLoading = (async () => {
      const { pipeline } = await import("@xenova/transformers");
      const pipe = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
      pipelineInstance = pipe as unknown as Pipeline;
      return pipelineInstance;
    })();
  }

  return pipelineLoading;
}

export async function embedText(text: string): Promise<number[]> {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await embedText(text));
  }
  return results;
}
