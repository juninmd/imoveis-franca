FROM node:20-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Build Client
COPY client/package.json client/pnpm-lock.yaml ./client/
RUN cd client && pnpm install --frozen-lockfile
COPY client/ ./client/
RUN cd client && pnpm run build

# Build Server
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build:release || pnpm exec tsc -p tsconfig.json

FROM node:20-slim
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install production dependencies for server
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["pnpm", "start"]
