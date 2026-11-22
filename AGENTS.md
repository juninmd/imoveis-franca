# AGENTS.md

Imoveis Franca: scraper and REST API for real-estate listings in Franca/SP, with a React frontend in `client/`. Results are cached in Redis.

## Stack

- TypeScript 5.3, Node >= 20.9 (CI: 22), Express 4
- Scraping: Puppeteer, Cheerio, Axios
- Cache: Redis (ioredis), optional
- Tests: Jest + ts-jest (backend), Vitest + Testing Library (`client/`)
- Lint: ESLint (`.eslintrc.json`), Prettier
- Package manager: pnpm (`pnpm-lock.yaml`, `client/pnpm-lock.yaml`)

## Commands

- Install: `pnpm install`
- Build: `pnpm build` (installs and builds `client/`, then `tsc -p tsconfig.json`)
- Start: `pnpm start` (`node dist/src/index.js`)
- Lint: `pnpm lint`
- Test: `pnpm test` (Jest); `pnpm test:coverage` for coverage
- Frontend: `cd client && pnpm run test`, `pnpm run test:coverage`, `pnpm run lint`
- Clean: `pnpm clean`
- CI (`.github/workflows/ci.yml`): lint, client coverage, build, backend coverage

## Structure

- `src/index.ts`, `src/server.ts`: entry point and Express app
- `src/imoveis.ts`, `src/query.ts`: listing pipeline and query filters
- `src/sites/`: one scraper per site or agency, registered in `src/sites/index.ts`
- `src/infra/`: browser, cache and infrastructure helpers. `src/utils/`, `src/types/`
- `__tests__/`: one test file per provider plus shared suites. `__mocks__/`: module mocks
- `client/`: Vite/React frontend (`src/components/`, `src/hooks/`)
- `scripts/`: utility scripts (listing advertisers, preview screenshots)

## Conventions

- Add a provider as `src/sites/<name>.ts` plus a test in `__tests__/`, and register it in `src/sites/index.ts`.
- Tests and lint must pass before merge; CI runs both.

## Gotchas

- Env vars: `PORT` (3000), `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `TRUST_PROXY`. Redis is optional: the API answers without cache when it is down.
- `GET /api/imoveis` is rate-limited to 60 requests/min per IP. Each cache miss runs a full scrape, so keep the limit.
- `GET /healthz` must stay free of Redis dependencies (orchestrator health check).
- The shared Chromium recycles (`browser.recycle`, `src/infra/browser.ts`) after an empty first page.
- Do not commit `.env` or secrets. `.gitleaksignore` and `.trivyignore` hold scanner exceptions.

<!-- base-actions-main-policy -->
## GitHub Actions — padrão obrigatório (@main)

- Referencie as actions internas sempre pelo branch, nunca por SHA:
  - `uses: juninmd/base-actions/<action>@main`
  - `uses: juninmd/base-actions/.github/workflows/<arquivo>.yml@main`
- Não fixe `@<sha>` em `juninmd/base-actions`: a atualização é centralizada no
  `main` e passa a valer no próximo run.
- PRs cujos checks não iniciam por billing/spending limit são mesclados pelo bot central
  `juninmd/base-actions/.github/workflows/auto-merge-billing-blocked.yml`.
  Para impedir o merge automático de um PR, aplique a label `do-not-merge`.
