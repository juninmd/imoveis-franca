# Research — Plataforma moderna: compra/aluguel, robustez, Docker, UX

Issue: https://github.com/juninmd/imoveis-franca/issues/49

## Goal
Tornar a plataforma "imoveis-franca" totalmente funcional e moderna: agregador robusto de
múltiplos sites de imobiliárias de Franca/SP, com suporte explícito a **comprar** e **alugar**,
rodável via Docker, com UI/UX validada por screenshots.

## Non-goals
- Autenticação/contas de usuário.
- Trocar Redis por outro cache/DB.
- Rebrand (nome/logo).
- Reescrever os 45+ adapters de scraping do zero (só ajustar o necessário para suportar
  compra/aluguel e robustez).

## Acceptance criteria
1. `Imoveis`/`Imovel` ganha um campo de finalidade (`tipo: 'venda' | 'aluguel'`), populado pelos
   adapters ou inferido pela URL/keywords quando o site não distinguir.
2. API `/api/imoveis` aceita filtro `tipo` (ou `finalidade`) e o front tem toggle Comprar/Alugar.
3. `docker compose up` sobe `app` (Node) + `redis` localmente sem erro; health check 200 em `/`.
4. `pnpm lint`, `pnpm build`, `pnpm test:coverage` (100% threshold backend) e `client` build/test
   passam.
5. Screenshots da UI (light/dark, desktop/mobile) capturados via Playwright para revisão de UX.
6. Scrapers existentes seguem funcionando — nenhuma regressão nos testes atuais (`__tests__/`).

## Codebase map
- **Server**: `src/server.ts:1` — Express, helmet, compression, cors, serve `client/dist`, rota
  `GET /api/imoveis` (`src/server.ts:42`) chama `generateList`.
- **Boot cache warm**: `src/index.ts:1` chama `generateList({})` na subida e importa `./server`.
- **Orquestração de scraping**: `src/imoveis.ts`
  - `generateList` (`src/imoveis.ts:73`) — quantiza params (`getQuantizedParams`,
    `src/imoveis.ts:56`), itera `sites.filter(enabled)`, cache por site no Redis (chave
    `${site.name}-${JSON.stringify(baseQueryParams)}`, TTL 3600s), depois `filterImoveis`,
    `sortImoveis`, `calcularValorMedioBairroPorAreaTotal`.
  - `filterImoveis` (`src/imoveis.ts:9`) — filtros atuais: preço, quartos, área, área total,
    banheiros, vagas, endereço. **Não existe filtro de finalidade (compra/aluguel).**
  - `getImoveis`/`retrieveContent` (`src/imoveis.ts:106,147`) — 3 drivers: `axios`, `puppet`
    (Puppeteer + stealth via `src/infra/browser.ts:1`), `axios_rest`.
  - `retrieImoveisSiteByParams` (`src/imoveis.ts:197`) — paginação com `p-limit(5)`.
- **Modelo de dados**: `src/types/index.ts:1` — `Imoveis` não tem campo de finalidade
  (venda/aluguel), nem `tipoImovel` (casa/apto/terreno). `Site.adapter` retorna
  `{ imoveis, qtd, html?, json? }`.
- **Sites**: `src/sites/index.ts` agrega 45+ adapters (`src/sites/*.ts`), cada um com seu próprio
  parser de HTML/JSON. Nenhum adapter atual popula finalidade — grep por
  `alugar|aluguel|finalidade|venda` não achou uso real do conceito no domínio (falsos positivos
  em nomes de variáveis).
- **Infra**: `src/infra/redis.ts:1` singleton `ioredis`, host default
  `redis.databases.svc.cluster.local` (cluster interno) — **local dev depende de
  `REDIS_HOST`/Docker Compose**, hoje inexistente no repo. `src/infra/browser.ts:1` singleton
  Puppeteer+stealth com request interception (bloqueia imagens/css/js).
- **Frontend**: React 19 + Vite + Tailwind 4 + TanStack Query + framer-motion + react-virtuoso.
  `client/src/Home.tsx` — filtros (preço, quartos, banheiros, vagas, área, área total, endereço),
  dark mode, favoritos (localStorage), grid/list view, sort. **Sem toggle comprar/alugar.**
  `client/src/api.ts:1` chama `GET /api/imoveis`. `client/src/types.ts` espelha `Imoveis` sem
  finalidade.
- **Docker**: `Dockerfile:1` multi-stage (build client + server, runtime `node:24-slim`), expõe
  3000, `CMD pnpm start`. **Sem `docker-compose.yml`** — não há Redis local orquestrado; hoje só
  roda contra Redis de cluster.
- **CI/CD**: `.github/workflows/ci.yml` (lint + client test + build + backend coverage),
  `deploy.yml` (build/push GHCR via `juninmd/base-actions/docker-build-push`), `security.yml`,
  `validate.yml`, `release-drafter.yml`.
- **Testes**: `jest.config.ts` — coverage threshold 100% em `src/**` exceto `server.ts`,
  `index.ts`, `infra/redis.ts`, `sites/**`. `__tests__/` tem 1 arquivo de teste por site.
  `scripts/generate-preview.ts` já existe (provável script de screenshot/preview — verificar antes
  de duplicar).
- **Sinal notável**: `test_redis.js` (raiz) contém apenas um `console.log` dizendo que é aceitável
  pular verificação visual via Playwright se a conexão Redis falhar — indica que specs anteriores
  já tentaram rodar Playwright localmente e esbarraram na falta de Redis local.

## Prior art / padrões de mercado (agregadores de imóveis)
- Zap Imóveis / Viva Real / QuintoAndar: toggle "Comprar / Alugar" sempre no topo da busca,
  compartilhando os mesmos filtros de preço/quartos mas com ranges e labels diferentes por
  finalidade (ex.: aluguel usa "valor mensal", compra usa "valor total"). Confirma que `tipo` deve
  ser um filtro de primeira classe, não um filtro genérico de endereço.
- Agregadores multi-fonte (ex. Housi, ImovelWeb) tratam cada site como uma fonte com
  normalização de schema único + dedupe por (endereço, área, valor aproximado) — este repo já
  tem o embrião disso em `calcularValorMedioBairroPorAreaTotal`, mas não deduplica anúncios
  duplicados entre sites.

## Constraints
- Node >= 20.9 (engines), pnpm 9 (Docker/CI), TypeScript 5.3 (server) / 5.9 (client).
- Coverage 100% obrigatório no backend fora das exceções listadas — qualquer novo código em
  `src/imoveis.ts` ou `src/types` precisa de testes cobrindo 100% branches.
- Scrapers dependem de HTML de terceiros — mudanças de schema (`Imoveis`) precisam ser opcionais/
  com fallback para não quebrar os 45+ adapters existentes de uma vez.
- Sem acesso a MCP/tool de Telegram nesta sessão (verificado na lista de tools disponíveis) — o
  pedido "me envie prints no telegram" não pode ser cumprido diretamente por mim; screenshots
  serão entregues via `SendUserFile` (anexo no Claude Code) e o usuário decide se repassa ao
  Telegram, ou eu configuro um webhook do Telegram se ele fornecer um bot token — **questão para
  o questionário do plano**.
- Redis em produção aponta para host de cluster interno (`redis.databases.svc.cluster.local`) —
  Compose local precisa de override de `REDIS_HOST=redis` sem tocar o default de produção.

## Risks
- Adicionar `tipo` (venda/aluguel) em 45+ adapters é o maior raio de impacto do pedido; fazer tudo
  de uma vez arrisca quebrar testes/coverage 100%. Abordagem recomendada: campo opcional com
  default inferido (URL/keyword), migração incremental site a site, sem quebrar contrato atual.
  Ranking: alto blast radius, decisão para o plano.
  Sonda: `docs/site-adapter-status.json` não existe — o plano deve incluir uma varredura rápida de
  quantos sites hoje têm URL contendo "aluguel"/"venda" para estimar esforço de inferência.
- `docker compose up` sem Redis definido hoje = qualquer teste de container falha logo de cara;
  é pré-requisito de baixo risco mas bloqueante para "use docker".
- Puppeteer em container `node:24-slim` frequentemente falha por falta de deps do Chromium —
  Dockerfile atual não instala libs do Chrome nem define `PUPPETEER_EXECUTABLE_PATH`; validar no
  plano/implementação.
- "Alcançar diversos sites" pode ser lido como "adicionar novos sites" (mais scrapers) ou
  "melhorar a robustez dos 45 existentes" — ambíguo, vai para o questionário.

## Open questions (para phase-plan)
1. Telegram: usuário tem bot token/chat id para eu configurar envio real, ou "prints no telegram"
   deve virar só `SendUserFile` que ele repassa manualmente?
2. Escopo de "alcançar diversos sites": adicionar sites novos de Franca (quais?) ou focar em
   deixar os 45 atuais robustos + suportar compra/aluguel neles?
3. Campo de finalidade: nome (`tipo`, `finalidade`, `operacao`) e valores (`'venda'|'aluguel'`
   vs `'comprar'|'alugar'`) — convenção a fixar antes de tocar 45 arquivos.
4. Sites sem indicação clara de finalidade na URL/HTML: aceitável marcar como `'ambos'`/
   `unknown` e deixar de fora do filtro estrito, ou é obrigatório resolver 100%?
5. Docker Compose: só para dev local (não sobrescrever `deploy.yml`/GHCR), correto?
6. Nível de "polimento" de UI/UX esperado — reuso do design atual (Tailwind já é moderno) com
   ajustes pontuais, ou redesign mais amplo?

## Status
Stage advanced to `prototype` (unattended, per dev-loop contract).
