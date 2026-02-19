import { findModelEntry, getModelFilePath, isModelDownloaded } from "./models";
import { prisma } from "./prisma";

interface LlmState {
  activeModelId: string | null;
  llama: unknown;
  model: unknown;
  context: unknown;
  restorePromise: Promise<void> | null;
}

const state: LlmState = {
  activeModelId: null,
  llama: null,
  model: null,
  context: null,
  restorePromise: null,
};

/**
 * Ensure the previously active model (from DB) is loaded into memory.
 * Called lazily on first access. Safe to call multiple times — only runs once.
 */
async function ensureModelRestored(): Promise<void> {
  if (state.activeModelId) return;

  if (!state.restorePromise) {
    state.restorePromise = (async () => {
      try {
        const config = await prisma.appConfig.findUnique({
          where: { key: "activeModel" },
        });

        if (!config?.value) return;

        const modelId = config.value;
        const entry = findModelEntry(modelId);
        if (!entry) return;
        if (!isModelDownloaded(modelId)) return;

        // Load the model into memory
        await loadModelInternal(modelId);
      } catch {
        // Silently fail — model will show as inactive
      }
    })();
  }

  await state.restorePromise;
}

/**
 * Get active model ID, restoring from DB if needed.
 * Use this in API routes that need the current model status.
 */
export async function getActiveModelIdAsync(): Promise<string | null> {
  await ensureModelRestored();
  return state.activeModelId;
}

async function loadModelInternal(modelId: string): Promise<void> {
  const entry = findModelEntry(modelId);
  if (!entry) throw new Error(`Model not found: ${modelId}`);

  const modelPath = getModelFilePath(modelId);
  if (!modelPath) throw new Error(`Model file not found for: ${modelId}. Please download it first.`);

  // Unload current model if any
  await unloadModel();

  const { getLlama } = await import("node-llama-cpp");

  const contextSize = parseInt(process.env.LLM_CONTEXT_SIZE || "4096", 10);

  const llama = await getLlama();
  const model = await llama.loadModel({ modelPath });
  const context = await model.createContext({ contextSize });

  state.llama = llama;
  state.model = model;
  state.context = context;
  state.activeModelId = modelId;
}

export async function loadModel(modelId: string): Promise<void> {
  await loadModelInternal(modelId);
}

export async function unloadModel(): Promise<void> {
  if (state.context) {
    await (state.context as { dispose: () => Promise<void> }).dispose();
  }
  if (state.model) {
    await (state.model as { dispose: () => Promise<void> }).dispose();
  }
  state.llama = null;
  state.model = null;
  state.context = null;
  state.activeModelId = null;
}

export async function* generateStream(
  systemPrompt: string,
  userMessage: string
): AsyncGenerator<string, void, unknown> {
  await ensureModelRestored();

  if (!state.context) {
    throw new Error("No model loaded. Please activate a model from the admin page.");
  }

  const { LlamaChatSession } = await import("node-llama-cpp");

  const session = new LlamaChatSession({
    contextSequence: (state.context as { getSequence: () => unknown }).getSequence() as never,
    systemPrompt,
  });

  const chunks: string[] = [];
  let resolveChunk: ((value: string | null) => void) | null = null;

  const chunkPromise = () =>
    new Promise<string | null>((resolve) => {
      resolveChunk = resolve;
    });

  // Run prompt in background, pushing chunks as they arrive
  const promptDone = session.prompt(userMessage, {
    onTextChunk(chunk: string) {
      if (resolveChunk) {
        const r = resolveChunk;
        resolveChunk = null;
        r(chunk);
      } else {
        chunks.push(chunk);
      }
    },
  }).then(() => {
    // Signal completion
    if (resolveChunk) {
      resolveChunk(null);
    } else {
      chunks.push("__DONE__");
    }
  });

  // Yield chunks as they arrive
  while (true) {
    if (chunks.length > 0) {
      const chunk = chunks.shift()!;
      if (chunk === "__DONE__") break;
      yield chunk;
    } else {
      const chunk = await chunkPromise();
      if (chunk === null) break;
      yield chunk;
    }
  }

  await promptDone;
}
