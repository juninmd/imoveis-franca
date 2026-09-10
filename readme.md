# Imoveis Franca

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]()

Web scraper de imóveis em Franca/SP. Coleta dados de anúncios de imóveis para análise e consulta.

## Funcionalidades

- Web scraping de sites de imóveis em Franca-SP
- Cache com Redis para otimização
- API REST para consulta dos dados
- Frontend para visualização

## Stack

- **Linguagem:** TypeScript 5.x
- **Runtime:** Node.js 20.x
- **Framework:** Express 4.x
- **Scraping:** Puppeteer, Cheerio, Axios
- **Cache:** Redis (ioredis)
- **Testes:** Jest
- **Lint:** ESLint
- **CI/CD:** GitHub Actions

## API

`GET /api/imoveis` — devolve `{ data: Imovel[], total: number }`.

| Parâmetro | Tipo | Observação |
|---|---|---|
| `tipo` | `venda` \| `aluguel` | outros valores são ignorados |
| `minPrice`, `maxPrice` | número | limitado a 20.000.000 |
| `minArea`, `maxArea`, `minAreaTotal`, `maxAreaTotal` | número | limitado a 10.000 m² |
| `minBedrooms`, `minBathrooms`, `minVacancies` | número | limitado a 50 |
| `address` | string ou lista | até 30 bairros, 120 caracteres cada |

Valores inválidos são descartados em vez de gerarem erro. A rota está limitada a 60
requisições por minuto por IP (`429` com `Retry-After` acima disso), porque cada miss de
cache dispara um scraping completo.

`GET /healthz` — health check para orquestradores, sem dependência de Redis.

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `3000` | porta do servidor |
| `REDIS_HOST` | `redis.databases.svc.cluster.local` | host do Redis |
| `REDIS_PORT` | `6379` | porta do Redis |
| `REDIS_PASSWORD` | — | senha, quando houver |

O Redis é opcional: se estiver fora do ar a API continua respondendo, só sem cache.

## Instalação

```bash
pnpm install
```

## Uso

```bash
# Build
pnpm run build

# Iniciar servidor
node dist/src/index.js
```

## Licença

MIT
