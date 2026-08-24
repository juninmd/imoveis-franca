FROM node:24-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# Build Client
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Build Server
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm run build:release || pnpm exec tsc -p tsconfig.json

FROM node:24-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9 --activate

# Chromium do sistema para o driver 'puppet' (evita baixar/rodar um Chromium incompatível
# com a imagem slim, que não traz as libs nativas necessárias).
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium curl \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install production dependencies for server
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/healthz || exit 1
CMD ["pnpm", "start"]
