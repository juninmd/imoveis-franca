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

# Install production dependencies for server
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["pnpm", "start"]
