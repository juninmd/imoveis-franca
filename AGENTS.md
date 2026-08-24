# AGENTS.md - imoveis-franca

## Tech Stack
- **Language:** TypeScript 5.3
- **Runtime:** Node.js 20.x
- **Framework:** Express 4.x
- **Scraping:** Puppeteer, Cheerio, Axios
- **Cache:** Redis (ioredis)
- **Testing:** Jest + ts-jest
- **Lint:** ESLint + Prettier
- **CI:** GitHub Actions

## Project Structure
```
imoveis-franca/
  src/              # TypeScript source
  client/           # Frontend app
  __tests__/        # Test files
  scripts/          # Utility scripts
  Dockerfile        # Container config
  tsconfig.json
```

## Commands
- `pnpm build` — Compile TypeScript
- `pnpm test` — Run Jest tests
- `pnpm lint` — ESLint check
- `pnpm start` — Run compiled app
- `pnpm test:coverage` — Coverage report

## Environment Variables
- `REDIS_URL` — Redis connection string
- `PORT` — Server port
