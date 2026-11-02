# Imoveis Franca

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)]()

Web scraper de imóveis em Franca/SP. Coleta dados de anúncios de imóveis para análise e consulta.

## Funcionalidades

- Web scraping de sites de imóveis em Franca-SP
- Cache com Redis para otimização
- API REST para consulta dos dados
- Frontend para visualização

## Capturas de tela

Interface da busca com resultados reais obtidos localmente pelo Docker Compose.

### Comprar

![Tela de compra com filtros laterais e anúncios de imóveis em Franca](./.workflow/49-plataforma-moderna-compra-aluguel/screenshots/docker-live-comprar-images-fixed.png)

### Alugar

![Tela de aluguel com filtros laterais e 229 anúncios disponíveis](./.workflow/49-plataforma-moderna-compra-aluguel/screenshots/docker-live-aluguel-real.png)

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
| `tipoImovel` | string ou lista | `casa`, `apartamento`, `terreno`, `rural`, `comercial`; anúncios sem tipo reconhecido continuam na lista |
| `q` | texto | busca em título, descrição, bairro e código, sem diferenciar acento ou caixa (até 100 caracteres) |

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

### Cobertura de providers

Além das imobiliárias locais, o scraping cobre os portais Casamineira, Chaves na Mão, Imovelweb, VivaReal, ZAP e OLX (venda e aluguel). `npx tsx scripts/list-advertisers.ts` lista os anunciantes de Franca no Chaves na Mão por volume, para achar lacunas. Cada anunciante grande sem provider deve ter o site procurado por sondagem de domínio, não só por busca na web: foi assim que apareceram `soldimob.com.br` (API Kenlo), `jlbarcellosimoveis.com.br` (WordPress/Houzez), `s2iinteligenciaimobiliaria.com.br` (API Tecimob, identificada pelo cabeçalho `x-domain`; as fotos vêm do detalhe de cada imóvel), `belavistarp.com.br` (catálogo `/llms.txt`, o mesmo formato da Ferreira Ferreira; só os anúncios de Franca são mantidos) e `menezesimobi.com.br` (Mariane Menezes Negócios Imobiliários, plataforma Univen/Tokko com ~1.000 anúncios de Franca misturados aos da rede regional; achado pelo nome completo do anunciante, e não por variações do nome da corretora). `imobiliariavale.com.br` (plataforma Simob/Flexpro: o site descobre o tenant em `simob.com.br/.../params?host=` e usa um Bearer público; fotos e áreas vêm do detalhe), `mudare.imb.br` (plataforma Imoview: `POST /retornar-imoveis-disponiveis`, limite de 20 registros por página) e `begimoveissp.com.br` (B&G/BEG Imóveis, de São Paulo, com ~11 anúncios em Franca lidos do JSON-LD). `jresendeimoveis.com.br` (J. Resende, de Ribeirão Preto, com carteira em Franca; plataforma Kurole em ISO-8859-1), `vivendanegociosimob.com.br` (Vivenda Negócios Imobiliários, site em ISO-8859-1 que o Chaves na Mão listava como "Vivenda Imobiliária"; achado pelo telefone e pelo endereço da página de detalhe do anúncio, ~200 anúncios de venda), `sramosimoveis.com.br` (007 SRamos, credenciada Caixa) e `fcaimoveis.com.br` (FCA, leilões e Caixa), ambos na plataforma Colibex (`POST /api` filtrado por Franca: 19 e 25 imóveis de venda). Os domínios homônimos de outras cidades (Larraz) não são da mesma empresa.

Uma segunda enumeração vem dos anunciantes do Casamineira (`"publisher"` no JSON embutido da página): Imobiliária Vale, Leite Pimenta, Oliveira Imóveis Franca, Arbo, RE/MAX Par Imob, Santa Maria e L4S/L4S Brasil (a L4S é a plataforma Leads4Sales que publica as vitrines de imobiliárias já cobertas, como a Plano). A Mundial Imóveis é de Ribeirão Preto, sem anúncios de Franca; DreamCasa é de Ilhéus/BA.

Uma terceira enumeração foi feita no ZAP e no VivaReal (o JSON embutido de cada página traz `advertiser` com nome, CRECI e telefone): os anunciantes com volume são Mariane Menezes, Pimenta Imóveis, JL Barcellos, Carlos Antonio Soares (Carlos Imóveis), Mercado Imóveis, Assescon, J. Resende, Comerian e Galo Branco Administradora de Bens, todos com provider exceto o último (sem site próprio; o `galobranco.com.br` é um posto de combustível). A primeira versão dessa enumeração era parcial (o regex de `advertiser` só casava ~5 de 30 anunciantes por página e um navegador reaproveitado deixava de receber páginas); com o regex robusto e um Chromium novo por página, o ZAP entrega ~50 páginas de venda e ~34 de aluguel, o que revelou mais anunciantes (ver abaixo). O OLX não expõe o anunciante nos cartões da listagem, então não dá para enumerá-lo por ali.

A enumeração completa do ZAP/VivaReal trouxe `diasediasimobiliaria.com.br` (Dias & Dias, mesmo CMS ISO-8859-1 da Vivenda, agora em `platforms/gridlist.ts`), `soniaeramalhoimoveis.com.br` (Sônia & Ramalho, plataforma Kurole como a J. Resende, em `platforms/kurole.ts`) e `ispernassifimobiliaria.com.br` (Isper Nassif: `POST assets/ajax/imoveis.php?option=buscarimoveis`, `offset` em itens com 9 por página, ~13 s por requisição; o catálogo traz negociados, então cada finalidade só aceita itens "disponível"; descrições às vezes vêm em base64). Os cartões do gridlist passaram a descartar outras cidades pelo `.loc` ("bairro / Cidade - UF"): Vivenda caiu de 202 para 183 e Dias & Dias de 172 para 148 anúncios. `nbimobiliaria.com.br` (N&B Imóveis, ASP clássico em UTF-8, carteira de Franca com ~4 locações e nenhuma venda no momento; o cartão não traz cômodos nem área). Anunciantes que ainda não têm provider: F G B (84 anúncios, só Instagram/VivaReal), EGX, BCA e Galo Branco (sem site próprio), Só Flats e A.F. (sites não confirmados) e corretores individuais (CRECI -F). Lago (Ribeirão Preto), Siga (Cachoeirinha) e Araújo Júnior foram sondados e não anunciam em Franca. Uma busca web pelos nomes que faltavam não achou F G B, EGX nem BCA, mas listou agências de Franca ainda sem provider: `atitudeimoveisoficial.com.br` (Atitude Imóveis, ImobiBrasil com `/llms.txt`, 42 anúncios de venda; o certificado TLS do domínio não confere, então o catálogo e os links ficam em http, e o parser compartilhado ganhou `upgradeHttps=false`) e `olafranca.com.br` (Olá Franca, a mesma plataforma Univen/Tokko da Menezes, reaproveitando `parseMenezes`: ~1.060 anúncios de venda e 5 de locação, sem nenhum anúncio em comum com a Menezes). França Prime é de São Paulo e foi descartada. Um diretório de imobiliárias de Franca (guiaimobiliarias.com) serviu de nova fonte: comparar os domínios dele com `src/sites` achou `camargoimoveisfranca.com.br` (11 anúncios) e `jlimoveisfranca.com.br` (113), ambos ImobiBrasil via o novo `buildLlmsSite`; `goncalvesdonzelli.com.br` (1 venda e 7 locações em Franca) e `patrimoniosimob.com.br` (48 vendas; o antigo `hrsantos.com.br` redireciona para ele), ambos Tecimob via `platforms/tecimob.ts`, agora compartilhado com a S2I (o campo `transaction` separa venda de aluguel). `calixtoimoveis.com.br` redireciona para a C15, que já existia, e uns 18 domínios do diretório estão fora do ar. As demais páginas do diretório (13 no total) renderam `senhorferreira.com.br` (19 vendas) e `ednaimoveis.com.br` (22 vendas), ambas no CMS gridlist da Vivenda; `vencerimoveis.com.br` (WordPress/MyHome: `GET /wp-json/wp/v2/estate`, 46 vendas em Franca, tipo/cidade/bairro lidos das classes de taxonomia) e `imoveismorar.com.br` (Kenlo, 134 vendas; a API de locação responde vazia). O parser Kenlo saiu da Sold para `platforms/kenlo.ts`. `aluvend.com.br` (Fastimob: listagem HTML única em `/imoveis/pagina-N` com venda e locação misturadas; a finalidade e a cidade vêm do link do cartão, então os dois sites varrem as mesmas ~6 páginas; 37 vendas e 15 locações; só a foto de capa vem na listagem) e `loft.com.br` (marketplace Next.js: `__NEXT_DATA__` de `/venda|aluguel/imoveis/sp/franca?pagina=N`, 38 por página, 1.317 vendas e 160 locações no total; os anúncios das parceiras que já têm provider — Matriz, Salomão Ferreira, B&G — são descartados para não duplicar, sobrando ~500 vendas e ~30 locações de L4S, Maria Rita, Jônadas e outras sem site próprio; fotos `mobile_*` pois a versão cheia dá 403). Os nomes do ZAP que ainda faltavam renderam, por busca web e fingerprint, `chavecertafranca.com.br` (Tiago Domiciano, Tecimob: 30 vendas), `vitalizeimoveisfrancasp.com.br` (ImobiBrasil: 124 vendas) e `lcastroimoveis.com.br` (Castro Corretor, cartões Vue renderizados no servidor em `/a-venda` e `/para-alugar?pagina=N`, ~210 vendas e 5 locações; as respostas variam um pouco entre rodadas, sugerindo limite de taxa). RE/MAX Smart Map, Wiser e Coimbra do ZAP são de outras cidades ou aliases (Rocha Coimbra já existia). Ficaram de fora: Aicon (só 10 posts WordPress, preço quase sempre ausente), QuintoAndar (a busca vem de uma API interna, sem resultados no HTML), CliqueiMudei/Mitula (agregadores que só repetem as imobiliárias), Ildeu (Imobzi, foco em litoral e chácaras, 80 imóveis sem Franca na venda) e Vitta Residencial e Território Urbano (incorporadora e consultoria).

Sem provider próprio, por não terem site de imobiliária (a listagem do Chaves na Mão e do Casamineira não expõe o site do anunciante, então cada nome foi buscado nos portais): Leite Pimenta e outros corretores individuais (o Casamineira os marca como tipo 4 e o registro de Leite Pimenta é CRECI-F, de pessoa física, enquanto as imobiliárias têm CRECI-J), Oliveira Imóveis Franca (só aparece em rede de portais) e Santa Maria (só tem CNPJ no portal). O Arbo é um marketplace estadual, não uma imobiliária de Franca. Todos anunciam pelos portais, que já são cobertos.

Avaliados e **não adicionados**: Olá Franca (1 imóvel e nenhum aluguel, mesmo executando o JavaScript), Imobiliária Conquista (conteúdo de Joinville/SC), Lago (5 anúncios), Wimoveis (mesmo inventário do Imovelweb), Trovit e Deztop (agregam anúncios de outros sites), QuintoAndar (carrega os anúncios por API do cliente, sem HTML estável).

### Cache

Cada site tem a sua entrada no Redis (`src/infra/site-cache.ts`):

- **Fresco (~1 h, com jitter de ±10%)**: devolvido direto, sem scraping.
- **Vencido (até 24 h depois)**: devolvido na hora e revalidado em segundo plano (stale-while-revalidate), então o usuário não espera o scraping quando o TTL vence.
- **Site fora do ar**: se a revalidação volta vazia, os dados antigos são mantidos e a próxima tentativa só ocorre em 5 min.
- **Primeiro acesso sem dados**: resultado vazio vira cache negativo de 5 min.

Portais enormes (`casamineira`, `chavesnamao`, `imovelweb`, `vivareal`, `zapimoveis`, `olx`) têm `maxPages` por site para limitar o custo de cada scraping. `zapimoveis`, `vivareal`, `imovelweb` e `olx` usam o Chromium (`driver: 'puppet'`) porque o `axios` recebe `403`.

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
