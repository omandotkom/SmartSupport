FROM node:20-alpine AS base

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ cmake

FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public 2>/dev/null || true

# Copy Prisma client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy node-llama-cpp native binaries
COPY --from=builder /app/node_modules/node-llama-cpp ./node_modules/node-llama-cpp

# Create data directory (will be overlaid by PVC mount)
RUN mkdir -p /app/data

EXPOSE 3000

ENV HOSTNAME=0.0.0.0
ENV PORT=3000

CMD ["node", "server.js"]
