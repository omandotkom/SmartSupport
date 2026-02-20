FROM node:20-bookworm AS base

# Install build dependencies for native modules
RUN apt-get update \
  && apt-get install -y --no-install-recommends git python3 make g++ cmake \
  && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app

# Prevent prisma generate from running inside npm postinstall (we run it explicitly below).
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma

# Copy node-llama-cpp native binaries
COPY --from=builder /app/node_modules/node-llama-cpp ./node_modules/node-llama-cpp
# Copy better-sqlite3 native module and bindings helper
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

# Create data directory (will be overlaid by PVC mount)
RUN mkdir -p /app/data

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "server.js"]
