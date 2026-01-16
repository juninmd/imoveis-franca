import qs from 'qs';
import axios from 'axios';
import pLimit from 'p-limit';
import { sites } from './sites';
import browser from './infra/browser';
import RedisConnection from './infra/redis';
import { Imoveis, Site } from './types';

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
}) => {
  const { maxPrice, minPrice, minBedrooms, minArea, maxArea, minAreaTotal, maxAreaTotal, minBathrooms, minVacancies, address } = queryParams;

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

    const endereco = !address || !!address.find(x => x === imovel.endereco);
    // Verificar se todos os filtros foram satisfeitos
    return passMaxPrice && passMinPrice && passMinArea && passMaxArea && passBedRooom && passMinBathroom && passMinVacancies && passMinAreaTotal && passMaxAreaTotal && endereco;
  });
};

export const sortImoveis = (imoveis: Imoveis[]) => {
  return imoveis.filter(q => q.valor > 0).sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

interface BaseQueryParams {
  minPrice: number,
  maxPrice: number,
  quartos: number,
  minArea: number,
  maxArea: number,
  maxPages?: number,
}

const PRICE_STEP = 50000;
const AREA_STEP = 50;

const getQuantizedParams = (query: any): BaseQueryParams => {
  const rawMinPrice = Number(query.minPrice) || 0;
  const rawMaxPrice = Number(query.maxPrice) || 2000000;
  const rawMinArea = Number(query.minArea) || 0;
  const rawMaxArea = Number(query.maxArea) || 500;

  return {
    // Quantize down for min, up for max to ensure superset
    minPrice: Math.floor(rawMinPrice / PRICE_STEP) * PRICE_STEP,
    maxPrice: Math.ceil(rawMaxPrice / PRICE_STEP) * PRICE_STEP,
    quartos: Number(query.minBedrooms) || 2,
    minArea: Math.floor(rawMinArea / AREA_STEP) * AREA_STEP,
    maxArea: Math.ceil(rawMaxArea / AREA_STEP) * AREA_STEP,
    maxPages: undefined,
  };
};

export const generateList = async (query) => {
  // Use quantized params for fetching/caching to improve cache hit rate
  const baseQueryParams = getQuantizedParams(query);

  let lista: Imoveis[] = [];

  const promises = sites.filter(q => q.enabled).map(async (site) => {
    // Include baseQueryParams in cache key to ensure cache respects filters
    const cacheKeyString = `${site.name}-${JSON.stringify(baseQueryParams)}`;
    const cacheValue: Imoveis[] = await RedisConnection.getKey(cacheKeyString);

    if (cacheValue) {
      return cacheValue;
    }

    const fetched = await retrieImoveisSite(site, baseQueryParams);
    // Cache the result for this specific query
    if (fetched && fetched.length > 0) {
        // Cache for 1 hour
        await RedisConnection.setKey(cacheKeyString, fetched, 3600);
    }
    return fetched;
  });

  const results = await Promise.all(promises);
  lista = results.flat();

  lista = filterImoveis(lista, query);
  lista = sortImoveis(lista);
  lista = calcularValorMedioBairroPorAreaTotal(lista);
  return lista;
};

export async function getImoveis(site: Site, params = undefined, baseQueryParams: BaseQueryParams, page: number, retry = 0) {
  try {
    if (params && site.translateParams) {
      Object.keys(site.translateParams).forEach((param => {
        const paramName = site.translateParams[param];
        if (paramName) {
          params[paramName] = baseQueryParams[param];
        }
      }));
    }

    const paginateParams = site.getPaginateParams(page);
    if (site.payload) {
      site.payload = { ...site.payload, ...paginateParams.payload };
    } else if (params) {
      params = { ...params, ...paginateParams.params };
    }

    const link = `${site.url}?${params ? qs.stringify(params) : ''}`;
    // console.info(`Fetching ${link} using ${site.driver}`);

    // We do not cache raw content by link anymore because we want to ensure fresh data or controlled cache via generateList
    const content = await retrieveContent(link, site, params);

    const { imoveis, qtd } = (await site.adapter(content));

    // Optional: still cache content for debugging or other purposes if needed,
    // but the main caching is now at the site list level.
    // await RedisConnection.setKey(`content-${link}`, html || json);

    return { imoveis, qtd, page };
  } catch (error) {
    if (retry > 2) {
      console.error(`Max retries reached for ${site.url} page ${page}`);
      return { imoveis: [], qtd: 0, page };
    }
    console.error(`Retry ${site.url} page ${page}, attempt ${retry + 1}`, error.message);
    return await getImoveis(site, params, baseQueryParams, page, retry + 1);
  }
}

export async function retrieveContent(url: string, site: Site, params = undefined) {
  if (site.driver === 'puppet') {
    const page = await browser.getNewPage();

    await page.goto(url.trim(), { timeout: 30000, waitUntil: 'networkidle0' });

    if (site.waitFor) {
      try {
        await page.waitForSelector(site.waitFor, { timeout: 10000 });
      } catch (e) {
        console.warn(`Timeout waiting for selector ${site.waitFor} on ${url}`);
      }
    }

    const html = await page.content();
    await page.close();
    return html;
  } else if (site.driver === 'axios') {
    const { data: html } = await axios.get(url, { responseEncoding: 'utf8', timeout: 30000 } as any);
    if (site.waitFor == undefined || (html as any).indexOf(site.waitFor) >= 0) {
      return html;
    }
  } else if (site.driver === 'axios_rest') {
    const { data: html } = await axios.request({ url, method: site.method, data: site.payload, params, timeout: 30000 });
    return html;
  }

  throw new Error(`Html content not found or driver not supported`);
}

export const retrieImoveisSite = async (site: Site, baseQueryParams: BaseQueryParams) => {
  let lista: any[] = [];
  try {

    if (site.params) {
      for (const params of site.params || []) {
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
    let lista: Imoveis[] = [];
    const page = 1;
    const { imoveis, qtd } = await getImoveis(site, params, baseQueryParams, page);

    if (imoveis && imoveis.length > 0) {
        lista.push(...imoveis);
    }

    const pages = qtd ? Math.ceil(qtd / site.itemsPerPage) : 1;
    console.info(`------- ${site.name} possuí ${pages} páginas. Initial fetch: ${imoveis?.length || 0} items.`);

    if (pages <= 1 || (baseQueryParams.maxPages && page >= baseQueryParams.maxPages)) {
      return lista;
    }

    const limit = pLimit(5); // Limit to 5 concurrent requests per site
    const promises: Promise<any>[] = [];

    for (let currentPage = 2; currentPage <= pages; currentPage++) {
      if (baseQueryParams.maxPages && currentPage > baseQueryParams.maxPages) {
        break;
      }

      promises.push(limit(async () => {
        const { imoveis, page } = await getImoveis(site, params, baseQueryParams, currentPage);
        console.info(`------- ${site.name} página ${page} de ${pages}`);
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
    return [];
  }
}

export function calcularValorMedioBairroPorAreaTotal(imoveis: Imoveis[]): Imoveis[] {
  const imoveisAtualizados = imoveis.map(imovel => {
    const imoveisMesmoBairro = imoveis.filter(
      i => i.endereco === imovel.endereco && i.areaTotal === imovel.areaTotal && i.areaTotal > 0
    );

    const somaValores = imoveisMesmoBairro.reduce((soma, i) => soma + i.valor, 0);
    const valorMedio = imoveisMesmoBairro.length ? somaValores / imoveisMesmoBairro.length : 0;

    return { ...imovel, valorMedioBairroPorAreaTotal: valorMedio };
  });

  return imoveisAtualizados;
}
