// Model types
export interface ModelInfo {
  id: string;
  label: string;
  sizeGB: number;
  ramGB: number;
  recommended: boolean;
  status: ModelStatus;
  downloadProgress?: DownloadProgress;
}

export type ModelStatus = "not_downloaded" | "downloading" | "downloaded" | "active";

export interface DownloadProgress {
  modelId: string;
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
}

// Knowledge Base types
export interface KnowledgeTopic {
  id: string;
  title: string;
  filename: string;
  content: string;
  chunks: number;
  createdAt: string;
}

// Chat types
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceReference[];
  sessionId: string;
  createdAt: string;
}

export interface SourceReference {
  topicId: string;
  topicTitle: string;
  snippet: string;
}

// API request/response types
export interface ChatRequest {
  sessionId: string;
  message: string;
}

export interface CreateSessionRequest {
  title: string;
}

export interface SetActiveModelRequest {
  modelId: string;
}

export interface StartDownloadRequest {
  modelId: string;
}

export interface HealthResponse {
  status: "ok" | "no_model";
  activeModel: string | null;
  topicsCount: number;
}
