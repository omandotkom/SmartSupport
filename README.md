# SmartSupport - Application Support Chat with RAG

## Project Overview

SmartSupport adalah aplikasi chat untuk tim Application Support. User (support agent) menjelaskan case/masalah yang dilaporkan end-user, lalu aplikasi memberikan jawaban/solusi berdasarkan knowledge base dokumen internal menggunakan RAG (Retrieval-Augmented Generation).

Semua berjalan **local/on-premise** — LLM, embedding, vector store, database — tanpa data keluar jaringan.

## Tech Stack (Next.js Monolith)

- **Framework**: Next.js 15 (App Router) + TypeScript
- **LLM**: Local via `node-llama-cpp` (GGUF models, configurable dari admin)
- **Embedding**: `@xenova/transformers` (model: `all-MiniLM-L6-v2`, local inference)
- **Vector Store**: Vectra (local vector DB, file-based, no external service)
- **Document Parsing**: TXT only (knowledge base per topik)
- **Database**: Prisma ORM + SQLite
- **UI**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Package Manager**: npm

## Available LLM Models

Configurable dari halaman `/admin`. Model di-download on-demand ke `DATA_DIR/models/`.

| ID | Label | File (GGUF Q4_K_M) | Size | RAM | Recommended |
|----|-------|---------------------|------|-----|-------------|
| `qwen2.5-7b` | Qwen 2.5 7B (Recommended) | `qwen2.5-7b-instruct-q4_k_m.gguf` | ~4.7 GB | ~6 GB | Yes |
| `deepseek-r1-7b` | DeepSeek R1 Distill 7B | `DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf` | ~4.7 GB | ~6 GB | No |
| `llama3.1-8b` | Llama 3.1 8B | `Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf` | ~4.7 GB | ~6 GB | No |
| `phi4-mini` | Phi-4 Mini 3.8B | `phi-4-mini-instruct-q4_k_m.gguf` | ~2.5 GB | ~4 GB | No |

Model download source: HuggingFace (bartowski quantizations atau official).

## Project Structure

```
SmartSupport/
├── CLAUDE.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env.local
├── Dockerfile
├── openshift/
│   ├── deployment.yaml
│   └── pvc.yaml
├── prisma/
│   └── schema.prisma
├── data/                              # ← PVC mount point (semua persistent data)
│   ├── smartsupport.db                # SQLite database
│   ├── models/                        # Downloaded GGUF model files
│   │   └── qwen2.5-7b-instruct-q4_k_m.gguf
│   ├── vectra_index/                  # Vectra persistent vector index
│   └── knowledge/                     # Uploaded knowledge base TXT files
│       ├── Reset Password.txt
│       └── VPN Connection Error.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Main chat page (/)
│   │   ├── admin/
│   │   │   └── page.tsx               # Admin page (/admin)
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts           # POST: send message, get RAG answer (streaming)
│   │   │   ├── sessions/
│   │   │   │   ├── route.ts           # GET: list, POST: create
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts       # GET: detail, DELETE: delete
│   │   │   ├── admin/
│   │   │   │   ├── models/
│   │   │   │   │   ├── route.ts       # GET: list models + status, PUT: set active model
│   │   │   │   │   └── download/
│   │   │   │   │       └── route.ts   # POST: download model, GET: download progress
│   │   │   │   └── knowledge/
│   │   │   │       ├── route.ts       # GET: list topics, POST: upload KB
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts   # GET: detail, DELETE: delete topic
│   │   │   └── health/
│   │   │       └── route.ts           # GET: health check (model loaded, etc)
│   │   └── globals.css
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── InputBar.tsx
│   │   │   └── SourceReference.tsx    # Tampilkan topik sumber
│   │   ├── sidebar/
│   │   │   └── SessionList.tsx
│   │   ├── admin/
│   │   │   ├── ModelSelector.tsx      # Pilih model + download
│   │   │   ├── ModelDownloadProgress.tsx  # Progress bar download
│   │   │   └── KnowledgeManager.tsx   # Upload & manage KB topics
│   │   └── ui/                        # shadcn/ui components
│   ├── lib/
│   │   ├── rag.ts                     # RAG pipeline (retrieve + generate)
│   │   ├── vectorstore.ts             # Vectra operations
│   │   ├── embeddings.ts              # @xenova/transformers wrapper
│   │   ├── llm.ts                     # node-llama-cpp wrapper (load/unload model)
│   │   ├── models.ts                  # Model registry & download logic
│   │   ├── knowledge-loader.ts        # Parse KB txt files, chunk & embed
│   │   └── prisma.ts                  # Prisma client singleton
│   ├── stores/
│   │   ├── chatStore.ts
│   │   └── adminStore.ts              # Admin state (model status, KB list)
│   └── types/
│       └── index.ts
└── docs/
```

## Database Schema (Prisma)

```prisma
model Session {
  id        String    @id @default(cuid())
  title     String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}

model Message {
  id        String   @id @default(cuid())
  role      String   // "user" | "assistant"
  content   String
  sources   String?  // JSON: [{ topicId, topicTitle, snippet }]
  sessionId String
  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}

model KnowledgeTopic {
  id        String   @id @default(cuid())
  title     String   @unique
  filename  String   // original uploaded filename
  content   String   // full text content
  chunks    Int      // number of chunks generated
  createdAt DateTime @default(now())
}

model AppConfig {
  key   String @id
  value String
}
// Used keys:
// - "activeModel": model ID string (e.g. "qwen2.5-7b")
```

## Core Features

### 1. RAG Chat (halaman `/`)
- User mengetik pertanyaan/case description di chat
- System melakukan semantic search ke Vectra untuk menemukan chunks KB yang relevan
- Context dari chunks relevan dikirim bersama pertanyaan ke local LLM
- LLM menghasilkan jawaban berdasarkan context (streaming via ReadableStream)
- Jawaban ditampilkan beserta referensi topik sumber
- Jika tidak ada KB relevan, jawab dengan jujur bahwa informasi tidak ditemukan
- Jika model belum di-download/aktif, tampilkan pesan arahkan ke `/admin`

### 2. Admin - Model Management (halaman `/admin`)
- Tampilkan list model yang tersedia (lihat tabel di atas)
- Label **(Recommended)** pada Qwen 2.5 7B
- Setiap model menampilkan status:
  - `not_downloaded` — Belum ada di storage → tampilkan tombol **Download**
  - `downloading` — Sedang download → tampilkan **progress bar** (percentage + size)
  - `downloaded` — Sudah ada di storage → tampilkan tombol **Activate**
  - `active` — Model sedang aktif dipakai → tampilkan badge **Active**
- Download model dari HuggingFace ke `DATA_DIR/models/`
- Download progress di-track via polling (GET download progress endpoint)
- Hanya 1 model yang aktif pada satu waktu
- Switch model = unload model lama dari memory, load model baru

### 3. Admin - Knowledge Base Management (halaman `/admin`)
- Upload file `.txt` — hanya accept format `.txt`
- Format file TXT:

```
[Judul Topik]
Isi knowledge base untuk topik ini.
Bisa multi-line, multi-paragraph.
Berisi langkah-langkah troubleshooting, penjelasan, dsb.
```

Contoh `Reset Password.txt`:
```
[Reset Password]
Jika user lupa password, lakukan langkah berikut:
1. Buka halaman admin portal di https://admin.internal.co.id
2. Cari user berdasarkan email atau NIP
3. Klik tombol "Reset Password"
4. Password baru akan dikirim ke email user
5. Minta user cek email dan login dengan password baru

Jika email user tidak aktif:
1. Hubungi tim HR untuk verifikasi data karyawan
2. Update email di admin portal
3. Ulangi proses reset password
```

- Saat upload:
  1. Baca file, extract judul dari `[Judul Topik]` di baris pertama
  2. Simpan content ke database (tabel `KnowledgeTopic`)
  3. Chunk content (1000 chars, 200 overlap)
  4. Embed setiap chunk dan simpan ke Vectra dengan metadata `{ topicId, topicTitle }`
- List semua topik KB yang sudah di-upload
- Hapus topik (hapus dari DB + hapus vector dari Vectra)
- **Knowledge base diorganisir per topik** — setiap file = 1 topik

### 4. Source Citations
- Setiap jawaban menampilkan topik KB yang digunakan sebagai sumber
- Format: nama topik + snippet relevan
- User bisa validasi jawaban berdasarkan sumber

### 5. Chat Sessions
- Buat session baru untuk setiap case
- List semua sessions di sidebar
- Klik session untuk melihat history chat
- Hapus session (cascade delete messages)

## API Routes

```
# Chat
POST   /api/chat                        # Kirim pesan, streaming RAG answer
GET    /api/sessions                     # List sessions
POST   /api/sessions                     # Create session
GET    /api/sessions/[id]                # Session detail + messages
DELETE /api/sessions/[id]                # Delete session

# Admin - Models
GET    /api/admin/models                 # List models + status (downloaded/active/etc)
PUT    /api/admin/models                 # Set active model { modelId: "qwen2.5-7b" }
POST   /api/admin/models/download        # Start download { modelId: "qwen2.5-7b" }
GET    /api/admin/models/download        # Get download progress

# Admin - Knowledge Base
GET    /api/admin/knowledge              # List all KB topics
POST   /api/admin/knowledge              # Upload KB file (.txt, multipart/form-data)
GET    /api/admin/knowledge/[id]         # Get topic detail
DELETE /api/admin/knowledge/[id]         # Delete topic + vectors

# Health
GET    /api/health                       # App health, model status
```

## RAG Pipeline Flow

```
User Question
    ↓
Embed question (@xenova/transformers — all-MiniLM-L6-v2)
    ↓
Semantic search di Vectra (top-k=5, cosine similarity)
    ↓
Retrieve relevant chunks + metadata (topicId, topicTitle)
    ↓
Build prompt: system message + context chunks + user question
    ↓
Stream to local LLM (node-llama-cpp, active model)
    ↓
Stream answer back to client + return source topics
```

## System Prompt Template (untuk LLM)

```
Kamu adalah asisten support yang membantu tim Application Support menyelesaikan masalah user.
Jawab pertanyaan HANYA berdasarkan konteks dokumen yang diberikan.
Jika informasi tidak ada di dokumen, katakan dengan jelas bahwa kamu tidak menemukan informasi tersebut di knowledge base.
Berikan jawaban yang terstruktur dan actionable.
Sebutkan topik sumber informasi jika memungkinkan.

Konteks Dokumen:
---
Topik: {topicTitle}
{chunkContent}
---
Topik: {topicTitle}
{chunkContent}
---
```

## Environment Variables (.env.local)

```
DATA_DIR=./data
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RESULTS=5
LLM_CONTEXT_SIZE=4096
LLM_GPU_LAYERS=0
```

Semua path persistent diturunkan dari `DATA_DIR`:
- SQLite: `${DATA_DIR}/smartsupport.db`
- Models: `${DATA_DIR}/models/`
- Vectra index: `${DATA_DIR}/vectra_index/`
- Knowledge docs: `${DATA_DIR}/knowledge/`

Tidak ada API key — semua local.

## Development Commands

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
# → http://localhost:3000

# Reset database
npx prisma db push --force-reset
```

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "node-llama-cpp": "^3",
    "@xenova/transformers": "^2.17",
    "vectra": "latest",
    "@prisma/client": "latest",
    "zustand": "latest",
    "tailwindcss": "^4",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "typescript": "^5",
    "@types/node": "^22",
    "@types/react": "^19"
  }
}
```

## Coding Conventions

- **Naming**: camelCase untuk variable/function, PascalCase untuk component/class/type
- **API responses**: Gunakan typed response objects, format JSON konsisten
- **Error handling**: Return proper HTTP status codes dengan `NextResponse.json({ error: "..." }, { status: 4xx })`
- **Typing**: Strict TypeScript — no `any`, selalu define interface/type
- **Code comments**: Bahasa Inggris. UI text: Bahasa Indonesia
- **Imports**: Gunakan `@/` path alias (maps to `src/`)
- **Server vs Client**: Gunakan `"use client"` hanya pada component yang butuh interactivity. Default server component.

## Important Rules

1. **Jangan hallucinate**: Jika dokumen tidak mengandung informasi, jangan mengarang jawaban
2. **Selalu sertakan sumber**: Setiap jawaban harus mereferensikan topik KB asal
3. **Chunk size penting**: 1000 chars dengan 200 overlap — balance antara konteks dan presisi
4. **Streaming response**: Gunakan Next.js streaming (ReadableStream) untuk response LLM
5. **File validation**: Hanya accept `.txt` untuk KB upload, max 10MB per file
6. **Server-only imports**: `node-llama-cpp`, `vectra`, `@xenova/transformers`, `prisma` hanya dipakai di server (API routes). Jangan import di client components
7. **Data directory**: Semua persistent data di `DATA_DIR` (`./data`). Jangan di-commit ke git
8. **Single replica**: Karena SQLite + Vectra + LLM file-based, deploy hanya 1 replica di OpenShift
9. **Model lifecycle**: Hanya 1 model loaded di memory pada satu waktu. Unload sebelum load model baru
10. **KB format**: Setiap file `.txt` harus punya `[Judul Topik]` di baris pertama

## Deployment (OpenShift)

### Architecture

```
┌──────────────────────────────────────────────────┐
│  OpenShift Project                               │
│                                                  │
│  ┌────────────────────────┐   ┌───────────────┐ │
│  │  Pod (Next.js)         │   │    PVC        │ │
│  │  ┌──────────────────┐  │   │   (RWO)       │ │
│  │  │ App Container     │  │   │               │ │
│  │  │ - Next.js server  │──────│ /app/data     │ │
│  │  │ - node-llama-cpp  │  │   │ ├── models/   │ │
│  │  │ - SQLite (r/w)    │  │   │ ├── vectra/   │ │
│  │  │ - Vectra (r/w)    │  │   │ ├── knowledge/│ │
│  │  └──────────────────┘  │   │ └── *.db       │ │
│  └────────────────────────┘   └───────────────┘ │
│                                                  │
│  Replicas: 1 (TIDAK boleh lebih)                 │
└──────────────────────────────────────────────────┘
```

### PVC Configuration (openshift/pvc.yaml)

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: smartsupport-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi        # ~5GB model + KB docs + DB + headroom
```

### Deployment Configuration (openshift/deployment.yaml)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: smartsupport
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: smartsupport
  template:
    metadata:
      labels:
        app: smartsupport
    spec:
      containers:
        - name: smartsupport
          image: image-registry.openshift-image-registry.svc:5000/<project>/smartsupport:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATA_DIR
              value: /app/data
            - name: LLM_GPU_LAYERS
              value: "0"
          volumeMounts:
            - name: data
              mountPath: /app/data
          resources:
            requests:
              memory: "6Gi"
              cpu: "2"
            limits:
              memory: "8Gi"
              cpu: "4"
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: smartsupport-data
---
apiVersion: v1
kind: Service
metadata:
  name: smartsupport
spec:
  selector:
    app: smartsupport
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: smartsupport
spec:
  to:
    kind: Service
    name: smartsupport
  port:
    targetPort: 3000
  tls:
    termination: edge
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/node-llama-cpp ./node_modules/node-llama-cpp
COPY --from=builder /app/prisma ./prisma

RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "server.js"]
```

### Deploy Commands

```bash
# Apply PVC dan Deployment
oc apply -f openshift/pvc.yaml
oc apply -f openshift/deployment.yaml

# Build & push image
oc new-build --binary --name=smartsupport
oc start-build smartsupport --from-dir=. --follow
```

### Penting untuk OpenShift

- **Replicas wajib 1**: SQLite, Vectra, dan LLM model file tidak support concurrent access
- **Strategy: Recreate**: Hindari 2 pod akses file bersamaan
- **PVC 20Gi**: Model GGUF ~5GB + KB docs + DB + headroom
- **Memory 6-8Gi**: LLM 7B Q4 butuh ~5-6GB RAM saat inference
- **CPU 2-4 core**: Lebih banyak core = inference lebih cepat
- **Tidak ada secret API key**: Semua local, tidak perlu secret untuk AI
- **Model download dari pod**: Admin download model via UI, disimpan ke PVC
