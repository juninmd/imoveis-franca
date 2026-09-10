import { stringify as stringifyQuery } from 'qs';
import axios from 'axios';
import pLimit from 'p-limit';
import { sites } from './sites';
import browser from './infra/browser';
import RedisConnection from './infra/redis';
import singleFlight from './infra/single-flight';
import { getQuantizedParams, parseFilters } from './query';
import { BaseQueryParams, Imoveis, Site } from './types';

export const filterImoveis = (imoveis: Imoveis[], queryParams: {
  maxPrice?: number;
  minPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  minAreaTotal?: number;
  maxAreaTotal?: number;
  minBathrooms?: number;
  minVacancies?: number;
  address?: string[];
  tipo?: 'venda' | 'aluguel';
}) => {
  const { maxPrice, minPrice, minBedrooms, minArea, maxArea, minAreaTotal, maxAreaTotal, minBathrooms, minVacancies, address, tipo } = queryParams;

  return imoveis.filter(imovel => {
    const passMaxPrice = !maxPrice || imovel.valor <= maxPrice;
    const passMinPrice = !minPrice || imovel.valor >= minPrice;
    const passMinArea = !minArea || imovel.area >= minArea;
    const passMaxArea = !maxArea || imovel.area <= maxArea;
    const passMinAreaTotal = !minAreaTotal || imovel.areaTotal >= minAreaTotal;
    const passMaxAreaTotal = !maxAreaTotal || imovel.areaTotal <= maxAreaTotal;
    const passBedRooom = !minBedrooms || imovel.quartos >= minBedrooms;
    const passMinBathroom = !minBathrooms || imovel.banheiros >= minBathrooms;
    const passMinVacancies = !minVacancies || imovel.vagas >= minVacancies;
    const passTipo = !tipo || imovel.tipo === tipo || imovel.tipo === 'ambos';

    const endereco = !address || !!address.find(x => x === imovel.endereco);
    // Verificar se todos os filtros foram satisfeitos
    return passMaxPrice && passMinPrice && passMinArea && passMaxArea && passBedRooom && passMinBathroom && passMinVacancies && passMinAreaTotal && passMaxAreaTotal && passTipo && endereco;
  });
};

// `precoPorMetro` vem de divisões feitas nos adapters e pode chegar NaN/Infinity (área zero).
// NaN em comparador de sort faz o Array.prototype.sort devolver uma ordem arbitrária e
// contamina toda a lista, não só o item inválido — por isso normalizamos antes de ordenar.
const MAX_PAGES = 200;

const finiteOrZero = (value: number): number => (Number.isFinite(value) ? value : 0);

/**
 * O link vem do HTML de sites que nao controlamos.
 *
 * Nao e uma defesa contra XSS: o React ja troca um `href` `javascript:` por uma URL que so
 * lanca se clicada (verificado no react-dom 19.2), entao nada executa. O ponto e outro — um
 * anuncio cujo link nao e http(s) e artefato de scraping: o card ofereceria um botao "Ver
 * Detalhes" que nao leva a lugar nenhum. Sai da lista aqui, na origem, em vez de cada
 * consumidor ter que se defender.
 */
export const isSafeLink = (link: string): boolean => {
  if (!link) {
    return true; // sem link nao ha nada para o navegador abrir
  }
  try {
    // O construtor de URL ja remove espacos e caracteres de controle antes de ler o esquema.
    const { protocol } = new URL(link);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return true; // relativo: resolve no proprio host, sem esquema perigoso
  }
};

export const sanitizeImoveis = (imoveis: Imoveis[]): Imoveis[] =>
  imoveis
    .filter(imovel => isSafeLink(imovel.link))
    .map(imovel => ({ ...imovel, precoPorMetro: finiteOrZero(imovel.precoPorMetro) }));

// O mesmo anúncio aparece repetido quando um site é varrido por vários conjuntos de params
// (ex.: venda + aluguel) ou quando a paginação se sobrepõe.
export const dedupeImoveis = (imoveis: Imoveis[]): Imoveis[] => {
  const seen = new Set<string>();
  return imoveis.filter(imovel => {
    const key = imovel.link || `${imovel.site}|${imovel.titulo}|${imovel.valor}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const sortImoveis = (imoveis: Imoveis[]) => {
  // Sem preço por metro conhecido o imóvel vai para o fim, e não para o topo como "mais barato".
  // `Infinity - Infinity` e NaN, e um comparador que devolve NaN deixa a ordem indefinida
  // justamente quando ha varios imoveis sem preco por metro — que e o caso comum.
  const rank = (imovel: Imoveis) =>
    (Number.isFinite(imovel.precoPorMetro) && imovel.precoPorMetro > 0 ? imovel.precoPorMetro : Number.MAX_SAFE_INTEGER);
  return imoveis.filter(q => q.valor > 0).sort((a, b) => rank(a) - rank(b));
};

/** O que destes `baseQueryParams` de fato chega a este site. Fonte unica para a requisicao
 *  e para a chave de cache: se as duas divergirem, buscas diferentes passam a compartilhar a
 *  mesma entrada de cache. */
const relevantBaseParams = (site: Site, baseQueryParams: BaseQueryParams): Record<string, unknown> => {
  const relevant: Record<string, unknown> = {};
  for (const param of Object.keys(site.translateParams || {})) {
    if (site.translateParams[param]) {
      relevant[param] = baseQueryParams[param];
    }
  }
  return relevant;
};

/**
 * Chave de cache com o minimo que muda a resposta daquele site.
 *
 * Antes a chave carregava todos os `baseQueryParams`, mas so 5 dos ~60 sites usam
 * `translateParams` (e apenas para preco e pagina): area e quartos nunca chegam a lugar
 * nenhum. O produto cartesiano de todos os campos dava ~3e11 chaves possiveis, e CADA chave
 * nova custava um scraping completo dos ~60 sites — um cliente remoto conseguia transformar
 * requisicoes baratas em trabalho ilimitado de rede e memoria de Redis.
 */
export const cacheKeyFor = (site: Site, baseQueryParams: BaseQueryParams): string =>
  `${site.name}-${JSON.stringify(relevantBaseParams(site, baseQueryParams))}`;

export const generateList = async (query) => {
  const filters = parseFilters(query);
  // Use quantized params for fetching/caching to improve cache hit rate
  const baseQueryParams = getQuantizedParams(filters);

  let lista: Imoveis[] = [];

  const promises = sites.filter(q => q.enabled).map(async (site) => {
    const cacheKeyString = cacheKeyFor(site, baseQueryParams);
    const cacheValue: Imoveis[] = await RedisConnection.getKey(cacheKeyString);

    if (cacheValue) {
      return cacheValue;
    }

    // Coalesce: com o cache frio, N requisições simultâneas disparavam N scrapings completos
    // do mesmo site (cada um com Chromium e dezenas de páginas) antes de qualquer uma gravar
    // no Redis. Agora a segunda em diante espera a primeira.
    return singleFlight.run(cacheKeyString, async () => {
      const fetched = await retrieImoveisSite(site, baseQueryParams);
      // Cache o resultado, inclusive quando vazio ("cache negativo"): sem isso, um site
      // permanentemente fora do ar (domínio morto, 404/410, timeout) fazia CADA requisição a
      // /api/imoveis esperar de novo pelas 3 tentativas x até 30s dele, deixando a API lenta
      // (minutos) em toda chamada sem cache. TTL curto para vazio permite recuperação rápida
      // caso o site volte a funcionar.
      const ttl = fetched && fetched.length > 0 ? 3600 : 300;
      await RedisConnection.setKey(cacheKeyString, fetched, ttl);
      return fetched;
    });
  });

  const results = await Promise.all(promises);
  lista = results.flat();

  lista = sanitizeImoveis(lista);
  lista = dedupeImoveis(lista);
  lista = filterImoveis(lista, filters);
  lista = sortImoveis(lista);
  lista = calcularValorMedioBairroPorAreaTotal(lista);
  return lista;
};

export async function getImoveis(site: Site, params = undefined, baseQueryParams: BaseQueryParams, page: number, retry = 0) {
  try {
    // `params` e `site.payload` são objetos do módulo, compartilhados por TODAS as requisições
    // e por todas as páginas em voo (pLimit roda 5 em paralelo). Mutá-los fazia as páginas
    // concorrentes sobrescreverem o `skip`/`page` umas das outras — buscando a mesma página
    // várias vezes e pulando outras — e deixava o filtro de preço de um usuário grudado na
    // configuração do site para o próximo. Daqui pra frente só trabalhamos com cópias locais.
    let requestParams = params ? { ...params } : params;

    if (requestParams && site.translateParams) {
      for (const [param, value] of Object.entries(relevantBaseParams(site, baseQueryParams))) {
        requestParams[site.translateParams[param]] = value;
      }
    }

    const paginateParams = site.getPaginateParams(page);
    let requestPayload = site.payload;
    if (site.payload) {
      requestPayload = { ...site.payload, ...paginateParams.payload };
    } else if (requestParams) {
      requestParams = { ...requestParams, ...paginateParams.params };
    }

    const link = `${site.url}?${requestParams ? stringifyQuery(requestParams) : ''}`;
    // console.info(`Fetching ${link} using ${site.driver}`);

    // We do not cache raw content by link anymore because we want to ensure fresh data or controlled cache via generateList
    const content = await retrieveContent(link, site, requestParams, requestPayload);

    const { imoveis, qtd } = (await site.adapter(content));

    // Optional: still cache content for debugging or other purposes if needed,
    // but the main caching is now at the site list level.
    // await RedisConnection.setKey(`content-${link}`, html || json);

    // Propaga a finalidade (venda/aluguel) do site para cada imóvel, respeitando um valor já
    // definido pelo próprio adapter (inferência por anúncio) quando existir.
    const imoveisComTipo = (imoveis || []).map(imovel => ({ ...imovel, tipo: imovel.tipo ?? site.tipo ?? 'ambos' }));

    return { imoveis: imoveisComTipo, qtd, page };
  } catch (error) {
    if (retry > 2) {
      console.error(`Max retries reached for ${site.url} page ${page}`);
      return { imoveis: [], qtd: 0, page };
    }
    console.error(`Retry ${site.url} page ${page}, attempt ${retry + 1}`, error.message);
    return await getImoveis(site, params, baseQueryParams, page, retry + 1);
  }
}

export async function retrieveContent(url: string, site: Site, params = undefined, payload = undefined) {
  if (site.driver === 'puppet') {
    const page = await browser.getNewPage();

    // `page.goto` estoura por timeout com frequência (30s, ~47 sites, 3 tentativas cada).
    // Sem o finally, a aba ficava aberta para sempre: cada falha vazava um processo de
    // renderização do Chromium até o container morrer por memória.
    try {
      await page.goto(url.trim(), { timeout: 30000, waitUntil: 'networkidle0' });

      if (site.waitFor) {
        try {
          await page.waitForSelector(site.waitFor, { timeout: 10000 });
        } catch (e) {
          console.warn(`Timeout waiting for selector ${site.waitFor} on ${url}`);
        }
      }

      return await page.content();
    } finally {
      try {
        await page.close();
      } catch (closeError) {
        console.warn(`Falha ao fechar a aba de ${url}`);
      }
    }
  } else if (site.driver === 'axios') {
    const { data: html } = await axios.get(url, { responseEncoding: 'utf8', timeout: 30000 } as any);
    if (site.waitFor == undefined || (html as any).indexOf(site.waitFor) >= 0) {
      return html;
    }
  } else if (site.driver === 'axios_rest') {
    const { data: html } = await axios.request({ url, method: site.method, data: payload ?? site.payload, params, timeout: 30000 });
    return html;
  }

  throw new Error(`Html content not found or driver not supported`);
}

export const retrieImoveisSite = async (site: Site, baseQueryParams: BaseQueryParams) => {
  let lista: any[] = [];
  try {

    if (Array.isArray(site.params) && site.params.length === 0 && !site.payload) {
      // `params: []` (array vazio) é truthy em JS, então `if (site.params)` sozinho pulava a
      // busca inteira em silêncio (nenhum fetch, nenhum log, nenhum erro) para sites que não
      // precisam de query params — tratamos como "busca única, sem params".
      const imoveis = await retrieImoveisSiteByParams(site, undefined, baseQueryParams)
      lista = lista.concat(imoveis);
    } else if (site.params) {
      for (const params of site.params) {
        const imoveis = await retrieImoveisSiteByParams(site, params, baseQueryParams)
        lista = lista.concat(imoveis);
      }
    } else if (site.payload) {
      const imoveis = await retrieImoveisSiteByParams(site, undefined, baseQueryParams)
      lista = lista.concat(imoveis);
    }
    return lista;
  } catch (error) {
    console.error(`Erro ao consultar o site ${site.name}: ${error.message} `);
    return lista;
  }
}

export const retrieImoveisSiteByParams = async (site: Site, params = undefined, baseQueryParams: BaseQueryParams) => {
  try {
    const lista: Imoveis[] = [];
    const page = 1;
    const { imoveis, qtd } = await getImoveis(site, params, baseQueryParams, page);

    if (imoveis && imoveis.length > 0) {
        lista.push(...imoveis);
    }

    // `qtd` e extraido do HTML/JSON de um site que nao controlamos. Sem teto, um total absurdo
    // (ou lixo) monta o array de promises inteiro ANTES do pLimit throttlar qualquer coisa.
    const rawPages = qtd > 0 && site.itemsPerPage > 0 ? Math.ceil(qtd / site.itemsPerPage) : 1;
    const pages = Math.min(rawPages, baseQueryParams.maxPages || MAX_PAGES);
    console.info(`------- ${site.name} possuí ${pages} páginas. Initial fetch: ${imoveis?.length || 0} items.`);

    if (pages <= 1 || (baseQueryParams.maxPages && page >= baseQueryParams.maxPages)) {
      return lista;
    }

    const limit = pLimit(5); // Limit to 5 concurrent requests per site
    const promises: Promise<any>[] = [];

    // `pages` ja embute `maxPages` e MAX_PAGES, entao nao ha segundo corte aqui.
    for (let currentPage = 2; currentPage <= pages; currentPage++) {
      promises.push(limit(async () => {
        const { imoveis, page } = await getImoveis(site, params, baseQueryParams, currentPage);
        console.info(`------- ${site.name} página ${page} de ${pages}`);
        /* istanbul ignore next */
        return imoveis || [];
      }));
    }

    const results = await Promise.all(promises);
    results.forEach(result => {
        if (result && result.length > 0) {
            lista.push(...result);
        }
    });

    return lista;
  } catch (error) {
    console.error(`Erro ao consultar o site ${site.name}: ${error.message} `);
    // Explicitly returning empty array
    return [];
  }
}

export function calcularValorMedioBairroPorAreaTotal(imoveis: Imoveis[]): Imoveis[] {
  const stats = new Map<string, { sum: number; count: number }>();

  // First pass: Calculate sums and counts
  for (const imovel of imoveis) {
    if (imovel.areaTotal > 0 && imovel.endereco) {
      const key = `${imovel.endereco}|${imovel.areaTotal}`;
      const stat = stats.get(key) || { sum: 0, count: 0 };
      stat.sum += imovel.valor;
      stat.count += 1;
      stats.set(key, stat);
    }
  }

  // Second pass: Assign averages
  return imoveis.map(imovel => {
    let valorMedio = 0;
    if (imovel.areaTotal > 0 && imovel.endereco) {
      const key = `${imovel.endereco}|${imovel.areaTotal}`;
      const stat = stats.get(key);
      if (stat && stat.count > 0) {
        valorMedio = stat.sum / stat.count;
      }
    }
    return { ...imovel, valorMedioBairroPorAreaTotal: valorMedio };
  });
}
