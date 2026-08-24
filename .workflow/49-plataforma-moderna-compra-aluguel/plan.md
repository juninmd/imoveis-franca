# Plan — Plataforma moderna: compra/aluguel, robustez, Docker, UX

Issue: https://github.com/juninmd/imoveis-franca/issues/49 · Prototype escolhido: **Variante B**
(hero de busca com abas Comprar/Alugar).

## Questionnaire (respondido em lote, todas as opções recomendadas aceitas)
1. Prints de UI/UX → **SendUserFile** (anexo no Claude Code); sem integração real com Telegram
   nesta entrega (sem MCP de Telegram disponível na sessão).
2. Escopo "diversos sites" → **robustecer os 45 sites já implementados**, sem adicionar sites
   novos.
3. Campo de finalidade → **`tipo: 'venda' | 'aluguel' | 'ambos'`**, inferido por site/URL, com
   `'ambos'` como fallback seguro.
4. Docker Compose → **somente dev local**; `deploy.yml`/GHCR não são alterados.

Nenhuma ambiguidade bloqueante restante — segue para implementação sem nova rodada de perguntas.

## Approach escolhido
Tratar finalidade (venda/aluguel) como atributo do **`Site`** (não do adapter/HTML), já que o
código hoje já modela isso implicitamente: `aacosta.ts:14-25` tem um bloco `negociacao: 1, //
aluguel` comentado (só compra ativa), e `imoveismpb.ts:93-107` já divide o mesmo site em dois
`Site` distintos (`mpbComprar`/`mpbAlugar`) por finalidade. Isso significa que anexar `tipo` a
cada objeto `Site` é uma mudança mecânica de 1 linha por site (baixo risco), e não exige tocar a
lógica de parsing de HTML dos 45 adapters. A propagação `Site.tipo → Imovel.tipo` acontece uma
única vez, na camada de orquestração (`src/imoveis.ts`).

### Alternativas rejeitadas
- **Inferir `tipo` por regex no `titulo`/`descricao` de cada imóvel individualmente** — mais
  "correto" por anúncio, mas exige tocar lógica de parsing em 45 arquivos e não é 100%
  confiável (nem todo anúncio menciona a finalidade no texto). Motivo da rejeição: alto blast
  radius sem ganho proporcional; pode ser um backlog item por-site depois.
- **Adicionar sites novos de Franca nesta entrega** — rejeitado pela resposta do usuário (Q2);
  vira backlog.
- **Redesenho estilo A (pill switch) ou C (sidebar-first)** — rejeitados na seleção de protótipo
  (`prototype.md`); usuário escolheu B (hero de portal).

## Steps

### 1. Modelo de dados — campo `tipo`
- Arquivos: `src/types/index.ts`, `client/src/types.ts`.
- Adicionar `tipo?: 'venda' | 'aluguel' | 'ambos'` em `Site`; `tipo: 'venda' | 'aluguel' |
  'ambos'` (obrigatório, com default resolvido na orquestração) em `Imoveis`/`Imovel`.
- verify: `pnpm exec tsc -p tsconfig.json --noEmit` sem erros.

### 2. Classificar `tipo` nos 45 sites
- Arquivo novo (throwaway, apagar após uso): `scripts/classify-site-tipo.ts` — varre
  `src/sites/*.ts`, procura por `venda|compra|comprar|aluguel|alugar|locacao|negociacao` em
  `url`/`params`/`payload` de cada `Site` exportado e imprime uma tabela
  `nome | tipo sugerido | evidência`.
- Rodar o script, revisar manualmente os "ambíguos", e então editar cada `src/sites/*.ts`
  adicionando `tipo: 'venda' | 'aluguel' | 'ambos'` no literal do `Site` (1 linha por objeto;
  `imoveismpb.ts` já é auto-evidente: `mpbComprar.tipo='venda'`, `mpbAlugar.tipo='aluguel'`).
  Sites sem sinal claro recebem `tipo: 'ambos'` — continuam aparecendo nos dois filtros, sem
  quebrar nada.
- verify: `node -e "require('./src/sites').sites.forEach(s=>{ if(!s.tipo) throw new Error(s.name) })"`
  via `tsx` (todo `Site` tem `tipo` definido) — comando real:
  `pnpm exec tsx -e "import('./src/sites').then(({sites}) => { const missing = sites.filter(s => !s.tipo); if (missing.length) { console.error(missing.map(s=>s.name)); process.exit(1);} console.log('ok', sites.length); })"`.

### 3. Propagar `tipo` de `Site` para `Imoveis` na orquestração
- Arquivo: `src/imoveis.ts` (`getImoveis`, ~linha 106-145).
- Após `const { imoveis, qtd } = await site.adapter(content);`, mapear:
  `imoveis.map(i => ({ ...i, tipo: i.tipo ?? site.tipo ?? 'ambos' }))` — respeita `tipo` vindo do
  adapter (abre espaço para inferência por anúncio no futuro) e cai no `site.tipo` como padrão.
- Testes: `__tests__/imoveis-branches.test.ts` (ou novo `imoveis-tipo.test.ts`) — mock de `site`
  com `tipo: 'aluguel'` e adapter retornando imóvel sem `tipo`; assert `resultado[0].tipo ===
  'aluguel'`. Cobrir também o caso `site.tipo` ausente → `'ambos'`.
- verify: `pnpm test -- imoveis` (ou `pnpm test:coverage`) 100% branches em `src/imoveis.ts`.

### 4. Filtro por `tipo` em `filterImoveis`
- Arquivo: `src/imoveis.ts:9` (`filterImoveis`).
- Adicionar parâmetro `tipo?: 'venda' | 'aluguel'` na assinatura; regra:
  `!tipo || imovel.tipo === tipo || imovel.tipo === 'ambos'`. Sem `tipo` na query, comportamento
  atual é preservado (não filtra) — o default visual "Comprar" fica só no front, não é forçado no
  backend (mantém a API backward-compatible).
- Testes: casos `tipo='venda'` exclui aluguel puro, `tipo='aluguel'` exclui venda pura, `'ambos'`
  aparece nos dois, sem `tipo` retorna tudo.
- verify: `pnpm test:coverage` mantém 100% em `branches/functions/lines/statements`.

### 5. Confirmar wiring da API
- Arquivo: `src/server.ts` (`GET /api/imoveis`, linha 42) — já repassa `req.query` inteiro para
  `generateList`; `generateList` (`src/imoveis.ts:73`) já passa `query` para `filterImoveis`. Sem
  mudança de código aqui, só teste de integração cobrindo `tipo` fim a fim.
- Teste novo: `__tests__/imoveis-tipo-integration.test.ts` chamando `generateList({ tipo:
  'aluguel' })` com Redis/sites mockados, validando que só itens `aluguel`/`ambos` retornam.
- verify: `pnpm test:coverage`.

### 6. Frontend — Hero de busca (Variante B) com toggle Comprar/Alugar
- Arquivos: `client/src/components/HeroSearch.tsx` (novo), `client/src/Home.tsx`,
  `client/src/types.ts`, `client/src/api.ts` (params já genéricos, sem mudança).
- `HeroSearch`: banner com abas grandes "Comprar"/"Alugar" (estado controlado pelo pai) + campos
  rápidos (bairro, preço min/máx, quartos) que espelham/sincronizam o mesmo `filters` state do
  `Home.tsx` — **não duplicar estado**; `FilterSidebar` continua com o filtro completo (área,
  banheiros, vagas, endereços) para não perder funcionalidade existente.
- `Home.tsx`: adicionar `tipo: 'venda'` ao estado inicial de `filters` (default = Comprar, igual
  ao protótipo B); passar `filters.tipo` para `fetchImoveis`; incluir em `activeFiltersList`/
  `clearFilters` (limpar filtros não deve resetar `tipo`, só os demais campos — manter contexto
  de comprar/alugar ao limpar); rótulos dinâmicos: "Valor total" (venda) vs "Valor mensal"
  (aluguel) no `FilterSidebar`/cards de preço.
- `client/src/components/PropertyCard.tsx`: exibir badge Venda/Aluguel e formatar preço conforme
  `tipo` (`R$ X` vs `R$ X/mês`).
- verify: `cd client && npm run lint`; `cd client && npm run build`.

### 7. Testes de frontend
- Arquivos: `client/src/components/HeroSearch.test.tsx` (novo), atualizar
  `client/src/App.test.tsx`/`FilterSidebar.test.tsx` se necessário para incluir `tipo` no shape de
  `filters` usado nos testes existentes.
- Casos: clicar em "Alugar" atualiza `tipo` e dispara novo fetch (via mock de `fetchImoveis`);
  estado inicial é "Comprar"; badge do card reflete `tipo` do imóvel.
- verify: `cd client && npm run test:coverage`.

### 8. Docker Compose para dev local + fix Puppeteer no Dockerfile
- Arquivo novo: `docker-compose.yml` (raiz) — serviços `app` (build a partir do `Dockerfile`
  existente, `env: REDIS_HOST=redis, REDIS_PORT=6379, PORT=3000`, `ports: 3000:3000`, `depends_on:
  redis`) + `redis` (`image: redis:7-alpine`, volume nomeado para persistência opcional).
- Ajuste `Dockerfile`: instalar dependências de sistema do Chromium na imagem `node:24-slim`
  (`apt-get install -y chromium libnss3 libatk1.0-0 libx11-xcb1 ...` ou usar
  `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` + apontar `PUPPETEER_EXECUTABLE_PATH` para o Chromium
  do sistema) — sem isso, `driver: 'puppet'` falha em runtime no container (risco identificado em
  `research.md`).
- verify: `docker compose up --build -d`; `curl -sf http://localhost:3000/api/imoveis?tipo=venda`
  retorna JSON 200; `docker logs` sem erro de Chromium ausente; `docker compose down -v`.

### 9. Health check
- Arquivo: `src/server.ts` — adicionar `GET /healthz` retornando `{ status: 'ok' }` (sem tocar
  Redis/scraping, só liveness); `Dockerfile` — `HEALTHCHECK CMD curl -f http://localhost:3000/healthz || exit 1`.
- verify: `curl -sf http://localhost:3000/healthz` → `{"status":"ok"}` (local e via compose).

### 10. Validação completa + screenshots de UI/UX
- Rodar suite completa: `pnpm lint`, `pnpm build`, `pnpm test:coverage` (100% threshold),
  `cd client && npm run lint && npm run build && npm run test:coverage`.
- Reutilizar/estender `scripts/generate-preview.ts` (Playwright) para capturar: home "Comprar"
  claro, home "Alugar" claro, modo escuro, estado vazio, mobile (viewport 390x844) — salvar em
  `preview-*.png`.
- Entregar via `SendUserFile` (não há integração de Telegram disponível nesta sessão).
- verify: todos os comandos acima retornam código 0; PNGs existem e não estão corrompidos
  (`file preview-*.png` mostra "PNG image data").

## Rollback
- Toda a mudança é aditiva/reversível por `git revert` do branch da feature — sem migração de
  dados, sem alteração de schema Redis (chaves de cache continuam compatíveis; na pior hipótese o
  cache antigo expira em 1h pelo TTL existente).
- `docker-compose.yml` é um arquivo novo e independente do pipeline de deploy (`deploy.yml`
  intocado) — remover o arquivo desfaz completamente essa parte sem efeito colateral.

## Confirmation-required
- Nenhum passo é destrutivo ou toca infraestrutura compartilhada; `docker compose up` sobe
  serviços locais isolados (Redis próprio do compose, não o `redis.databases.svc.cluster.local`
  de produção). Nenhuma confirmação adicional necessária antes de implementar.

## Backlog (fora do escopo desta entrega)
- Adicionar novos sites de imobiliárias de Franca ainda não cobertos.
- Inferência de `tipo` por anúncio individual (não só por site) para os sites marcados `'ambos'`.
- Integração real de envio de screenshots via bot do Telegram (requer token do usuário).
- Deduplicação de anúncios repetidos entre sites (mesmo imóvel anunciado em 2+ imobiliárias).
