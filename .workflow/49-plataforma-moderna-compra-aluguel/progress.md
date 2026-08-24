# Progress — implementação

Branch: `feat/compra-aluguel-plataforma-moderna`

## Drift em relação ao plano
- **Passo 2** previa um script `scripts/classify-site-tipo.ts` para classificar a finalidade dos
  45 sites. A varredura manual (`grep` por `venda|comprar|aluguel|alugar|locacao|finalidade|
  negociacao` em cada `src/sites/*.ts`) mostrou que **todos os 45 sites hoje só buscam
  listagens de venda/comprar** (URLs como `/comprar`, `/a-venda`, `?finalidade=venda`), exceto
  `imoveismpb.ts`, que já era dividido em `mpbComprar`/`mpbAlugar`. Não havia ambiguidade a
  resolver — escrever um script throwaway só para confirmar isso seria trabalho descartável sem
  valor; a classificação foi feita direto via grep + edição. Resultado prático: **`tipo: 'venda'`
  em 44 arquivos + `imoveismpb.ts` com `mpbComprar.tipo='venda'` / `mpbAlugar.tipo='aluguel'`**.
- **Implicação de produto**: com o escopo decidido (não adicionar sites novos), o filtro
  "Alugar" hoje só retorna itens de `imoveismpb.com.br - Alugar`. Isso é esperado dado a decisão
  tomada no questionário (Q2: robustecer os 45 atuais, sem novos sites) — registrado aqui para
  não ser lido como bug. Vira item de backlog (`plan.md`) buscar/ativar mais fontes de aluguel.

## Passo 1 — Modelo de dados
- `src/types/index.ts`: `Imoveis.tipo?` e `Site.tipo?` (`'venda' | 'aluguel' | 'ambos'`).
- `client/src/types.ts`: `Imovel.tipo` (obrigatório, sempre resolvido pelo backend).
- verify: pendente `tsc --noEmit` (aguardando `pnpm install`, ver seção Ambiente).

## Passo 2 — Classificação dos 45 sites
- `tipo: 'venda'` adicionado ao literal `Site` de 44 arquivos em `src/sites/*.ts`.
- `src/sites/imoveismpb.ts`: `mpbComprar.tipo='venda'`, `mpbAlugar.tipo='aluguel'`.
- verify: `Grep '^  tipo:' src/sites` → 45 arquivos, 1 ocorrência cada (sem duplicata) — confirmado.

## Passo 3 — Propagação Site → Imovel
- `src/imoveis.ts` (`getImoveis`): `(imoveis || []).map(i => ({ ...i, tipo: i.tipo ?? site.tipo ?? 'ambos' }))`.
  O guard `imoveis || []` cobre o caso de adapter retornando `null` (coberto por teste
  pré-existente `imoveis-branch-coverage.test.ts`).
- Testes novos: `__tests__/imoveis-tipo.test.ts` (propagação de `site.tipo`, fallback `'ambos'`,
  respeito a `tipo` já setado pelo adapter, não-crash com `imoveis: null`).
- verify: pendente `pnpm test:coverage` (ver Ambiente).

## Passo 4 — Filtro por tipo
- `src/imoveis.ts` (`filterImoveis`): novo parâmetro `tipo?`, regra
  `!tipo || imovel.tipo === tipo || imovel.tipo === 'ambos'`.
- Testes: `__tests__/imoveis-tipo.test.ts` (sem `tipo` retorna tudo; `venda` exclui aluguel;
  `aluguel` exclui venda; `'ambos'` aparece nos dois filtros).
- verify: pendente `pnpm test:coverage`.

## Passo 5 — Wiring da API
- Sem mudança de código: `src/server.ts:42` já repassa `req.query` completo para `generateList`,
  que repassa para `filterImoveis`. Confirmado por leitura, não precisou de novo teste de
  integração dedicado (coberto indiretamente pelos testes do passo 4).

## Passo 6 — Hero de busca (Variante B)
- `client/src/components/HeroSearch.tsx` (novo): abas Comprar/Alugar + busca rápida (bairro,
  preço min/máx, quartos), sincronizada com o mesmo estado `filters` do `Home.tsx` (sem estado
  duplicado).
- `client/src/Home.tsx`: `filters.tipo` (default `'venda'`), `<HeroSearch>` montado no topo do
  `<main>`, `clearFilters` preserva `tipo`, `activeFiltersCount` ignora `tipo` (é estrutural, não
  um filtro removível), contador de resultados mostra "N imóveis para comprar/alugar".
- `client/src/components/PropertyCard.tsx`: badge "Aluguel" + sufixo "/mês" no preço quando
  `tipo === 'aluguel'`.
- `client/src/components/FilterSidebar.tsx`: rótulo do bloco de preço muda para "Aluguel mensal
  (R$)" quando `tipo === 'aluguel'`.
- verify: pendente `cd client && npm run lint && npm run build`.

## Passo 7 — Testes de frontend
- `client/src/components/HeroSearch.test.tsx` (novo): tab ativa por padrão, troca para aluguel,
  placeholders dinâmicos, update de `minPrice`, lista de bairros.
- `App.test.tsx`/`FilterSidebar.test.tsx` não precisaram de mudança — `tipo` é opcional/tem
  default e os testes existentes continuam válidos com o shape antigo.
- verify: pendente `cd client && npm run test:coverage`.

## Passo 8 — Docker Compose (dev) + fix Puppeteer
- `docker-compose.yml` (novo, raiz): `app` (build local) + `redis:7-alpine`, `REDIS_HOST=redis`.
- `.dockerignore` (novo): exclui `node_modules`, `dist`, `.git`, `.workflow`.
- `Dockerfile`: instala `chromium`+`curl` na imagem de runtime, `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`
  + `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`, `HEALTHCHECK` usando `/healthz`.
- verify: pendente `docker compose up --build` (ver Ambiente).

## Passo 9 — Health check
- `src/server.ts`: `GET /healthz` → `{ status: 'ok' }`.
- verify: pendente `curl localhost:3000/healthz`.

## Passo 10 — Validação completa + screenshots

### Backend
- `node_modules/.bin/tsc -p tsconfig.json --noEmit` → sem erros.
- `node_modules/.bin/eslint . --ext .ts --ext .mts` → sem erros.
- `node_modules/.bin/jest --coverage` → **53 suítes, 173 testes, 100% statements/branches/
  functions/lines** (threshold do `jest.config.ts` mantido).
- `node_modules/.bin/tsc -p tsconfig.json` (build real) → sem erros.

### Frontend (`client/`)
- `node_modules/.bin/eslint .` → sem erros (após tipar `HeroSearchProps` com generics em vez de
  `any`, ver correção abaixo).
- `npm run build` (`tsc -b && vite build`) → build ok, bundle gerado normalmente incluindo PWA.
- `npx vitest run --coverage` → **4 arquivos, 11 testes, todos verdes** (client não tem threshold
  de cobertura configurado, ao contrário do backend — comportamento pré-existente, não alterado).

### Correções feitas durante a validação (não previstas literalmente no plano, mas dentro do escopo do passo 6/7)
- `getImoveis` (`src/imoveis.ts`): guard `(imoveis || [])` antes do `.map()` de propagação de
  `tipo` — sem isso, o teste pré-existente que simula adapter retornando `imoveis: null` quebraria
  (`Cannot read properties of null`). Também vira teste novo em `imoveis-tipo.test.ts`.
- `HeroSearch.tsx`: `setFilters` tipado com generics (`<T extends HeroFilters>`) em vez de
  `(prev: any) => any`, para satisfazer `@typescript-eslint/no-explicit-any` do client.
- `FilterSidebarProps.filters.tipo`: precisou ser obrigatório (não `tipo?`) para o `tsc -b` do
  client compilar — `Home.tsx` sempre fornece `tipo`, então o opcional só criava um mismatch de
  tipos no `setFilters` repassado ao `FilterSidebar`. `FilterSidebar.test.tsx` atualizado com
  `tipo: 'venda'` no `defaultFilters` de teste.

### Docker — verificado (rodada local a pedido do usuário)
- Docker Desktop foi iniciado e `docker compose up --build -d` rodou com sucesso.
- **Bug real encontrado e corrigido**: o Chromium falhava dentro do container
  (`Running as root without --no-sandbox is not supported`) porque a imagem roda como root e o
  Puppeteer não passava `--no-sandbox`. Corrigido em `src/infra/browser.ts`
  (`args: ['--no-sandbox', '--disable-setuid-sandbox']`), coberto pelos testes existentes
  (`infra-browser-tests.ts` já invoca `getBrowser()` de verdade com `puppeteer-extra` mockado) —
  100% de cobertura mantido.
- **Bug de ambiente encontrado e corrigido**: `docker-compose.yml` publicava a porta 6379 do
  redis no host, conflitando com um Redis de outro projeto já rodando ali. Removido o publish
  (o `app` fala com o `redis` pela rede interna do compose; publicar a porta nunca foi necessário
  para o funcionamento).
- `curl http://localhost:3000/healthz` → `{"status":"ok"}`.
- `curl http://localhost:3000/api/imoveis?tipo=venda` → **200, 2368 imóveis reais** (a maioria de
  `imoveisfranca.com.br` e `aacosta.com.br`; boa parte dos outros 43 sites voltou vazia nesta
  rodada — falha de rede/anti-bot pontual do ambiente, não do código: `filterImoveis`/`tipo`
  funcionaram corretamente sobre o que voltou).
- `curl http://localhost:3000/api/imoveis?tipo=aluguel` → **200, 0 imóveis** nesta rodada — reforça
  a limitação já documentada (só `imoveismpb.com.br` tem finalidade aluguel hoje) e, adicionalmente,
  esse site específico não retornou dados nesta execução (mesma causa de rede/anti-bot).
- Screenshot com dados reais capturado contra o app rodando em Docker (não mockado) — enviado ao
  usuário via `SendUserFile`.
- Stack deixada rodando (`docker compose up -d`) para o usuário navegar em
  http://localhost:3000 diretamente.

### Bug real encontrado ao navegar (fora do escopo original, corrigido a pedido do usuário)
- Usuário perguntou por que as fotos não apareciam nos cards. Diagnóstico: `imoveisfranca.com.br`
  (site com mais volume, 1870 de 2368 imóveis) trocou o markup do carrossel de fotos de
  `div.item` para `div.carousel-item` (atualização de Bootstrap do lado deles); o seletor do
  adapter (`src/sites/imoveis-franca.ts`) ficou desatualizado e sempre retornava `imagens: []`,
  mesmo o site tendo as fotos. Confirmado inspecionando o HTML real renderizado dentro do
  container.
- Corrigido o seletor para `div.carousel-inner > div.carousel-item > img`; fixture de teste
  (`__tests__/imoveis-franca-tests.ts`) atualizada para o markup real + novo caso de carrossel
  vazio. `pnpm test:coverage` → 53 suítes / **174 testes**, 100% mantido.
- Confirmado ao vivo: novo scrape (após `FLUSHALL` no Redis do compose) trouxe imagens em 2367 de
  2368 imóveis (`aacosta.com.br` já funcionava; agora `imoveisfranca.com.br` também). Screenshot
  `docker-live-comprar-images-fixed.png` mostra fotos reais nos cards.

## Pedido do usuário: "revise todos os seletores de todos os sites"

### Auditoria inicial
- Script de auditoria (`retrieImoveisSite` por site, `maxPages:1`) rodado contra os 47 `Site`
  dentro do container: **42 sites retornaram 0 itens**, 4 "ok", 1 desabilitado
  (`agnelloimoveis`). Nenhum erro de rede/HTTP na maioria — sinal de seletor desatualizado.
- Capturado o HTML/JSON real de cada site (`retrieveContent` direto, sem passar pelo adapter) —
  39 sites responderam com conteúdo real; 6 tiveram falha de conexão dura (não é seletor):
  `espaconobreimoveis` (404, endpoint mudou), `mazzaimoveis` (404), `imobiliariaplano` (timeout de
  navegação), `silveiraimoveis` (ECONNREFUSED), `imperadorimoveis` (domínio não resolve/DNS),
  `nielsenimoveis` (410 Gone); `pucciimobiliaria` devolveu um erro 500 do próprio backend PHP
  deles (site fora do ar do lado deles).

### Correção em paralelo (7 agentes, 34 sites)
Disparados 7 subagentes em paralelo, cada um com ~5 sites: ler o adapter, ler o HTML/JSON real
capturado, diagnosticar a causa raiz, aplicar o fix mínimo no seletor, reescrever a fixture do
teste para o markup real, e rodar o teste do arquivo. Resultado (16 adapters corrigidos, 20
arquivos de teste tocados/criados):

| Site | Causa raiz | 
|---|---|
| artefattoimoveis | Container `.imovel-box` → `article.item` |
| botelhoimobiliaria | Fallback de preço pegava um ícone antes do preço real |
| cintraimoveis | `.bairro_novo` sumiu (endereço sempre "Centro"); ícones renomeados |
| salimimobiliaria | Markup inteiro reescrito (`li.col-im-grid`, lazy-load `data-src`) |
| sueliandradelopes | Sufixo "Útil" no texto de área zerava `area` |
| tratoimoveis | `qtd` lia um `<h1>` que não existe mais |
| unicafrancaimoveis | Migrou para classes BEM (`.imovelcard`) |
| unioconimobiliaria | Rota `/buscar` virou 404; site migrou para `/imoveis` com markup novo |
| zagoimoveis | `qtd` pegava o dropdown de itens-por-página em vez do total real |
| conectaassesconimoveis | Título concatenava 3 `<span>`; quartos/banheiros/vagas viraram ícones `data-testid` sem texto |
| dinizmartins | Ícones `fa-bed/fa-bath/fa-car` → `flaticon-*`; `\|\| 1` mascarava zeros |
| faleirosimoveis | Template inteiro trocado (`.item` → `dl.gridTypeList`) |
| imobiliarialadonni | `.bximovel` não existe mais; cards reais são `.item-lista` |
| imobiliariapimentafranca | Site migrou para SPA Angular; características viraram ícones SVG |
| matriz | `.property-card` nunca existiu; cards reais são `.bento-card` |
| moradiaimoveis | `qtd` lia `.resultados`, classe real é `.quantidade` |

Sites investigados sem bug real encontrado (seletores já corretos contra o HTML real —
resultado baixo era filtro de preço "Consulte-nos" funcionando como projetado, não bug):
andresaborgesimoveis, boscoimoveis, bragaimobiliaria, carlosimoveisfranca, casanovaimoveis,
famaimoveisfranca, futuraimobiliariafranca, gpsnegociosimobiliarios, groupagility, grupohabitat,
habitesefranca, iegimoveisfrancaeregiao, oasisimobiliaria, parraimobiliaria, r2imob,
transacaoimobiliaria, vtiimoveis. `c15imob` e `anzimoveis` ficaram sinalizados como "não
corrigível a partir do HTML estático" (conteúdo injetado por JS/AJAX pós-carregamento, ou
fixture era uma página de erro).

Validação conjunta: `tsc --noEmit` limpo, `eslint` limpo, `jest --coverage` → **58 suítes / 187
testes, 100% cobertura**.

### A causa raiz de verdade: bug de orquestração, não de seletor
Ao reconstruir o container com os 16 fixes e testar de verdade (`docker compose up --build` +
`FLUSHALL` + chamada real à API), **os números não mudaram nada** — ainda só 2 sites
contribuindo. Investigação revelou o bug real, em `src/imoveis.ts` (`retrieImoveisSite`):

```js
if (site.params) {              // [] (array vazio) é TRUTHY em JS
  for (const params of site.params) { ... }   // 0 iterações → nenhum fetch, nenhum log
}
```

**35 dos 47 `Site` têm `params: []`** (array vazio, não `undefined`) — um padrão usado nos
arquivos para "este site não precisa de query params". Como array vazio é truthy, o código
entrava no `if` mas o `for...of` nunca rodava: **nenhuma requisição era feita, nenhum log,
nenhum erro — silêncio total**. Isso explica por que a auditoria original via `retrieImoveisSite`
achou "0 itens" em sites cujo HTML, quando buscado diretamente, provou estar 100% correto: os
seletores nunca chegavam a rodar porque o site nunca era buscado.

Fix em `src/imoveis.ts` (`retrieImoveisSite`): quando `params` é um array vazio e não há
`payload`, faz uma busca única sem params (em vez de pular a busca inteira em silêncio). Mantido
o comportamento original para `params` malformado/não-array (ainda lança erro e loga
"Erro ao consultar o site X", coberto por teste pré-existente) e para `params: undefined` sem
`payload` (ainda retorna `[]` sem tentar buscar, também coberto por teste pré-existente). Novo
teste: `__tests__/imoveis-empty-params.test.ts`.

**Resultado real, medido em produção (container Docker, `FLUSHALL` + nova busca completa):**

| | Antes (só selectors OK) | Depois (fix de orquestração) |
|---|---|---|
| Sites contribuindo dados | 2 (`aacosta`, `imoveisfranca`) | **29+** |
| Imóveis (venda) | 2368 | **7292** |
| Imóveis (aluguel) | 0 | **12** (`imoveismpb.com.br - Alugar`, confirmado em cache) |

`node_modules/.bin/jest --coverage` após o fix: **58 suítes / 187 testes, 100% cobertura**.
`tsc --noEmit` e `eslint` limpos.

### Achado adicional (backlog, não corrigido nesta sessão)
`getImoveis` (`src/imoveis.ts`) só mescla `paginateParams.params`/`.payload` na URL de paginação
— vários adapters retornam `getPaginateParams: (page) => ({ url: ... })` (uma URL pronta, não um
objeto `params`), que hoje é **ignorada silenciosamente**: a página 2+ desses sites refaz o fetch
da página 1. Não corrigido agora por risco de quebrar testes que já fixam esse comportamento em
vários arquivos — fica documentado como próximo passo de alto valor.

Também observado: sites permanentemente fora do ar (`mazzaimoveis`, `r2imob`,
`imobiliariaplano`, DNS morto de `imperadorimoveis`, etc.) fazem `generateList` esperar até 3
tentativas × 30s por página em CADA requisição, sem cache negativo — deixa `/api/imoveis` lento
em toda chamada sem cache. Vale um circuit-breaker/cache de falha como melhoria futura.

### Screenshots finais
`docker-live-all-sites-fixed.png` — tentativa de screenshot com o app real após o fix; o
carregamento inicial (sem cache) demorou mais que os testes de screenshot suportavam por causa do
achado acima (sites mortos atrasando `Promise.all`); a prova definitiva do resultado é a
contagem real via API/Redis documentada na tabela acima (dump em
`.workflow/49-plataforma-moderna-compra-aluguel/screenshots/../../../scratchpad` durante a
sessão, não commitado por ser artefato temporário de verificação).

### Screenshots de UI/UX
Capturados via Playwright (`scripts/generate-preview.ts`, estendido com `OUT`/`DARK`/`VIEWPORT`/
`TIPO`) contra `vite preview` (build de produção do client) em
`.workflow/49-plataforma-moderna-compra-aluguel/screenshots/`:
- `hero-comprar-light.png` / `hero-alugar-light.png` / `hero-comprar-dark.png` /
  `hero-mobile-light.png` — sem backend rodando (estado de erro no grid, esperado neste ambiente
  sem Redis/scraping ativo), mostram o hero, o toggle Comprar/Alugar e o layout responsivo.
- `populated-comprar-light.png` / `populated-alugar-light.png` / `populated-comprar-dark.png` —
  com resposta de `/api/imoveis` mockada via `page.route` (script auxiliar de uso único, não
  commitado) para mostrar os cards populados, o badge "Aluguel" + sufixo "/mês", e o rótulo
  "Aluguel mensal (R$)" no filtro de preço.
- Enviados ao usuário via `SendUserFile` nesta sessão (sem integração de Telegram disponível,
  conforme decidido no questionário).
