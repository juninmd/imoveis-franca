# Migração das primitivas locais para o `@juninmd/sonido`

O `client/` do imoveis-franca mantinha à mão vários primitivos que o
[`@juninmd/sonido`](https://github.com/juninmd/sonido) já publica. Esta pasta guarda a
comparação lado a lado usada na revisão da troca para a versão **2.4.0**.

As capturas são `antes-depois-dark.png` e `antes-depois-light.png`, feitas com o CSS real
do app (`client/src/index.css`) e dados **fictícios**: bairro, rua, imobiliária, anúncio e
preço não existem.

## O que foi trocado

| Componente     | Antes (imoveis-franca)                                                        | Depois (`@juninmd/sonido`)                                                                  | Arquivos principais                                                       |
| -------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Button`       | `<button>` com classes Tailwind copiadas em cada tela                         | `Button` (`primary`, `secondary`, `danger`, `ghost`, `link`; `appearance="outline"`; `xs`/`sm`/`icon`; `href`) | `Home.tsx`, `FilterSidebar.tsx`, `HeroSearch.tsx`, `PropertyCard.tsx`, `EmptyState.tsx` |
| `Badge`        | pílulas de status com `bg-*` fixo e contador de fotos/favoritos em `<div>`     | `Badge` (`solid`, `soft`, `count`, `dot`)                                                   | `PropertyCard.tsx`, `Home.tsx`                                            |
| `SubTabs`      | dois `<button>` dentro de uma div segmentada para grade/lista                 | `SubTabs` (`iconsOnly`, foco itinerante e `aria-selected`)                                  | `Home.tsx`                                                                |
| `TextField`    | `<label>` + `<input type="number">` com `inputClass` repetido                 | `TextField` (`compact`, rótulo ligado por `htmlFor`, `aria-describedby`)                    | `FilterSidebar.tsx`                                                       |
| `SearchField`  | `<input>` + ícone + botão “X” montados à mão (busca de bairro/imobiliária/palavra) | `SearchField` (rótulo acessível, Esc limpa, `clearLabel`)                                   | `FilterSidebar.tsx`                                                       |
| `EmptyState`   | componente local com título, dica e ação                                      | `EmptyState` com ícone, `titleAs="h3"` e ação `Button`; a moldura do app continua por fora   | `EmptyState.tsx`                                                          |
| `Spinner`      | `<Loader2 className="animate-spin" />`                                        | `Spinner` (SVG decorativo, herda `currentColor`)                                            | `Home.tsx`                                                                |
| `Skeleton`     | cinco blocos `animate-pulse` no fallback do painel de filtros                 | `Skeleton` (`rows`, região `role="status"`)                                                 | `Home.tsx`                                                                |

As cópias literais do código antigo ficam em `legacy/`:

- `legacy/FilterSidebar.tsx`, `legacy/PropertyCard.tsx` e `legacy/HeroSearch.tsx`:
  `git show origin/master:client/src/components/<arquivo>` com apenas os imports
  relativos ajustados para `../../../client/src/...`.
- `legacy/EmptyState.tsx`: cópia literal, sem ajustes de import.
- `legacy/HomeChrome.tsx` e `legacy/FilterBits.tsx`: trechos literais que estavam inline
  em `Home.tsx` e `FilterSidebar.tsx`, reunidos para o comparativo.

## Tema e ponte visual

- `@juninmd/sonido/styles.css` é importado **uma vez** em `client/src/main.tsx`, antes de
  `index.css`.
- O app pinta o tema pela classe `.dark`; o Sonido lê `data-theme`. O boot script de
  `client/index.html` e o efeito de tema em `Home.tsx` escrevem os dois (`dark`/`light`),
  então não há piscada nem divergência entre os temas.
- `client/src/index.css` tem a ponte de identidade: `--sn-color-accent`,
  `--sn-color-accent-2`, `--sn-gradient` e `--sn-gradient-soft` são mapeados para o azul
  do imoveis-franca nos temas claro e escuro. Nenhum outro token do Sonido é sobrescrito.
- A ponte também ajusta só o encaixe do chrome denso: `.filter-search` (36px),
  `.filter-field` (rótulo compacto), e `.empty-state-sonido` (remove a borda tracejada
  porque o card do app já desenha a moldura).

## Como as imagens foram geradas

`preview.html` + `preview.tsx` montam a mesma página com os dois lados. O CSS real do app
entra por `preview.css`; o servidor sobe com `client/vite.preview.config.ts`, que aponta a
raiz para o repositório e resolve os pacotes instalados em `client/node_modules`.

```bash
cd client
pnpm preview:sonido
# http://localhost:5313/docs/sonido-migration/preview.html
# http://localhost:5313/docs/sonido-migration/preview.html?theme=light
```

```bash
node C:/Users/jr_ac/AppData/Local/Temp/opencode/shot/full.cjs \
  "http://localhost:5313/docs/sonido-migration/preview.html" \
  "<abs>/docs/sonido-migration/antes-depois-dark.png"
node C:/Users/jr_ac/AppData/Local/Temp/opencode/shot/full.cjs \
  "http://localhost:5313/docs/sonido-migration/preview.html?theme=light" \
  "<abs>/docs/sonido-migration/antes-depois-light.png"
```

Viewport 1180×900, `deviceScaleFactor: 2`, `fullPage` → PNGs de 2360×7114.

## O que ficou de fora (e por quê)

- **Toast**: o `ToastContext` do app expõe `addToast(message, type)` e `removeToast(id)`.
  O `ToastProvider`/`useToast` do Sonido só empurra uma notificação e a remove pela
  animação, sem id. Trocar agora mudaria o contrato usado por `Home` e `PropertyCard`;
  fica como follow-up com um adaptador.
- **`Checkbox` nas listas de bairro/imobiliária**: cada linha é um `<button>` com caixa
  desenhada. O `Checkbox` do Sonido é um input rotulado único; a troca mudaria a
  semântica da linha (e os testes que clicam no texto).
- **Chips de filtro ativo** (multi-remoção): o `FilterChips` do Sonido é single-select
  (`value` + `onChange`) e não remove chip por chip.
- **`Card`**: o `PropertyCard` mantém a superfície `motion.div` com hover/tilt próprios;
  `Card` do Sonido mudaria a identidade do card. As primitivas internas foram trocadas.
- **`PropertyCardSkeleton`**: o `Skeleton` do Sonido sempre emite `role="status"`; doze
  cards gerariam doze regiões vivas. Só o fallback único do painel de filtros foi trocado.
- **`HeroSearch`**: o botão “Buscar” virou `Button`; os campos do hero mantêm o wrapper
  translúcido sobre o gradiente porque o visual faz parte da identidade da home.
- **Testes**: as buscas agora são `role="searchbox"` (input nativo `type="search"`), então
  `FilterSidebar.test.tsx` e `FilterSidebar.a11y.test.tsx` foram atualizados para o novo
  papel. Nenhum teste foi desativado ou pulado.
