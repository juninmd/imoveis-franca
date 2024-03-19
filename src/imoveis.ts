import qs from 'qs';
import axios from 'axios';
import { getNewPage, puppetAdapter } from './puppeter';
import { sites } from './sites';
import { Browser } from 'puppeteer';
import RedisConnection from './redis';
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
}) => {
  const { maxPrice, minPrice, minBedrooms, minArea, maxArea, minAreaTotal, maxAreaTotal, minBathrooms, minVacancies } = queryParams;

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

    // Verificar se todos os filtros foram satisfeitos
    return passMaxPrice && passMinPrice && passMinArea && passMaxArea && passBedRooom && passMinBathroom && passMinVacancies && passMinAreaTotal && passMaxAreaTotal;
  });
};

export const sortImoveis = (imoveis: any[]) => {
  return imoveis.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

interface BaseQueryParams {
  minPrice: number,
  maxPrice: number,
  quartos: number,
  minArea: number,
  maxArea: number,
  maxPages?: number,
}

export const generateList = async () => {
  const baseQueryParams: BaseQueryParams = {
    minPrice: 1,
    maxPrice: 500000,
    quartos: 2,
    minArea: 50,
    maxArea: 250,
    maxPages: undefined,
  };

  let lista: Imoveis[] = [];

  const browser = await puppetAdapter();
  const promsies: any[] = [];

  for (const site of sites.filter(q => q.enabled)) {
    const cacheKey: Imoveis[] = await RedisConnection.getKey(site.name);
    if (cacheKey) {
      lista = lista.concat(cacheKey);
      continue;
    }
    promsies.push(retrieImoveisSite(site, baseQueryParams, browser));
  }

  const promisesResolved: Imoveis[][] = await Promise.all(promsies);

  for (const promise of promisesResolved) {
    await RedisConnection.setKey(promise[0].site, promise);
  }

  lista = lista.concat(...promisesResolved);

  await browser.close();

  lista = sortImoveis(lista);
  return lista;
};

export async function getImoveis(site: Site, params = undefined, browser: Browser, baseQueryParams: BaseQueryParams, page: number) {
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
    const content = await retrieveContent(browser, link, site, params);
    console.info(link, site.driver);

    const { imoveis, qtd } = (await site.adapter(content));

    return { imoveis, qtd, page };
  } catch (error) {
    console.error(`Retry ${site.url}`, error);
    return await getImoveis(site, params, browser, baseQueryParams, page);
  }
}

async function retrieveContent(browser: Browser, url: string, site: Site, params = undefined) {
  if (site.driver === 'puppet') {
    const page = await getNewPage(browser);

    await page.goto(url.trim(), { timeout: 20000, waitUntil: 'networkidle0' });

    if (site.waitFor) {
      await page.waitForSelector(site.waitFor);
    }

    const html = await page.content();
    await page.close();
    return html;
  } else if (site.driver === 'axios') {
    const { data: html } = await axios.get(url, { responseEncoding: 'utf8' });
    if (site.waitFor == undefined || html.indexOf(site.waitFor) >= 0) {
      return html;
    }
  } else if (site.driver === 'axios_rest') {
    const { data: html } = await axios.request({ url, method: site.method, data: site.payload, params });
    return html;
  }

  throw new Error(`Html content not found`);
}

export const retrieImoveisSite = async (site: Site, baseQueryParams: BaseQueryParams, browser: Browser) => {
  let lista: any[] = [];
  try {

    if (site.params) {
      for (const params of site.params || []) {
        const imoveis = await retrieImoveisSiteByParams(site, params, baseQueryParams, browser)
        lista = lista.concat(imoveis);
      }
    } else if (site.payload) {
      const imoveis = await retrieImoveisSiteByParams(site, undefined, baseQueryParams, browser)
      lista = lista.concat(imoveis);
    }
    return lista;
  } catch (error) {
    console.error(`Erro ao consultar o site ${site.name}: ${error.message} `);
    return lista;
  }
}

export const retrieImoveisSiteByParams = async (site: Site, params = undefined, baseQueryParams: BaseQueryParams, browser: Browser) => {
  try {
    let lista: any[] = [];
    const page = 1;
    const { imoveis, qtd } = await getImoveis(site, params, browser, baseQueryParams, page);
    lista.push(...imoveis);
    const pages = Math.ceil(qtd / site.itemsPerPage);
    console.info(`------- ${site.name} possuí ${pages} páginas`);

    if (pages === 1 || (baseQueryParams.maxPages && page >= baseQueryParams.maxPages)) {
      return lista;
    }

    for (let currentPage = 2; currentPage <= pages; currentPage++) {
      const { imoveis, page } = await getImoveis(site, params, browser, baseQueryParams, currentPage);
      console.info(`------- ${site.name} página ${page} de ${pages}`);
      lista.push(...imoveis);
      if (baseQueryParams.maxPages && page >= baseQueryParams.maxPages) {
        return lista;
      }
    }
    return lista;
  } catch (error) {
    console.error(`Erro ao consultar o site ${site.name}: ${error.message} `);
    return [];
  }
}
