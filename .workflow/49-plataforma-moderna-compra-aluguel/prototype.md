# Prototype — seleção de direção UX

## Variantes apresentadas
- **A** — https://claude.ai/code/artifact/d1bcb93d-3545-4dfe-b88a-aed019ba0dff — pill switch
  Comprar/Alugar no header, mudança mínima sobre o layout atual.
- **B** — https://claude.ai/code/artifact/e0d372c0-0535-4375-931f-295b6493c776 — redesenho tipo
  portal (Zap/Viva Real): hero de busca com abas grandes Comprar/Alugar acima da barra de busca.
- **C** — https://claude.ai/code/artifact/ecc95f36-f608-44be-9829-68825d757968 — Comprar/Alugar
  como primeiro item da sidebar de filtros + chips de tipo de imóvel, header minimalista.

## Escolha
**Variante B** selecionada pelo usuário.

## Motivo / implicações para o plano
- A finalidade (comprar/alugar) vira o elemento estrutural mais visível da home — hero de busca
  com abas grandes, alinhado ao padrão dos portais consolidados de imóveis.
- Implica maior mudança visual em `client/src/Home.tsx` (novo hero, barra de busca) em relação a
  A/C — o plano deve prever refazer o topo da página mantendo sidebar de filtros avançados
  abaixo/ao lado, sem duplicar filtros já existentes (preço, quartos, etc. na searchbar do hero
  vs. sidebar).
- Reforça a necessidade do campo `tipo`/`finalidade` (venda/aluguel) no backend, já mapeada como
  risco #1 em `research.md`, pois agora é o filtro primário da UI, não um extra.
- Rejeitadas: A (mudança mínima, não usada), C (sidebar-first, não usada) — mantidas apenas como
  referência de fallback caso o hero em B se prove complexo demais durante o plano.

## Status
Stage advanced to `plan`.
