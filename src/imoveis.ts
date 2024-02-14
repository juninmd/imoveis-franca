import qs from 'qs';
import axios from 'axios';
import { getNewPage, puppetAdapter } from './puppeter';
import { Imoveis, Site, sites } from './sites';
import { Browser } from 'puppeteer';
import RedisConnection from './redis';

export const filterImoveis = (imoveis: Imoveis[], queryParams: { maxPrice?: any; minPrice?: any; quartos?: any; minArea?: any; maxArea?: any; }) => {
  const { maxPrice, minPrice, quartos, minArea, maxArea } = queryParams;

  return imoveis.filter(imovel => {
    // Verificar se os parâmetros estão definidos antes de aplicar os filtros
    const passMaxPrice = maxPrice === undefined || imovel.valor <= maxPrice;
    const passMinPrice = minPrice === undefined || imovel.valor >= minPrice;
    const passMinArea = minArea === undefined || imovel.areaTotal >= minArea;
    const passMaxArea = maxArea === undefined || imovel.areaTotal <= maxArea;
    const passQuartos = quartos === undefined || imovel.quartos >= quartos;

    // Verificar se todos os filtros foram satisfeitos
    return passMaxPrice && passMinPrice && passMinArea && passMaxArea && passQuartos;
  });
};

export const sortImoveis = (imoveis: any[]) => {
  return imoveis.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

export const generateList = async () => {
  const baseQueryParams = {
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
    promsies.push(retrieImoveisSite(site, browser, baseQueryParams));
  }

  const promisesResolved: Imoveis[][] = await Promise.all(promsies);

  for (const promise of promisesResolved) {
    await RedisConnection.setKey(promise[0].site, promise);
  }

  lista = lista.concat(...promisesResolved);

  await browser.close();

  lista = sortImoveis(lista);
  lista = filterImoveis(lista, { minPrice: 1, minArea: 1 });
  return lista;
};

export async function getImoveis(site: Site, browser: Browser, queryParams, page: number) {
  try {
    Object.keys(site.translateParams).forEach((param => {
      const paramName = site.translateParams[param];
      if (paramName) {
        site.params[paramName] = queryParams[param];
      }
    }));

    // Change Page
    const paramName = site.translateParams['currentPage'];
    if (paramName) {
      site.params[paramName] = page;
    }

    const link = `${site.url}?${qs.stringify(site.params)} `;
    const html = await retrieveHtml(browser, link, site);
    console.info(link, site.driver);

    const { imoveis, qtd } = (await site.adapter(html));

    return { imoveis, qtd, page };
  } catch (error) {
    console.error(`Retry ${site.url}`, error);
    throw error;
  }
}

async function retrieveHtml(browser: Browser, url: string, site: Site) {
  if (site.driver === 'puppet') {
    const page = await getNewPage(browser);

    await page.goto(url.trim(), { timeout: 20000, waitUntil: 'networkidle0' });

    if (site.waitFor) {
      await page.waitForSelector(site.waitFor);
    }

    const html = await page.content();
    await page.close();
    return html;
  }

  const { data: html } = await axios.get(url, { responseEncoding: 'utf8' });
  if (site.waitFor == undefined || html.indexOf(site.waitFor) >= 0) {
    return html;
  }
  throw new Error(`Html content not found`);
}

export const retrieImoveisSite = async (site: Site, browser, queryParams) => {
  let lista: any[] = [];
  try {
    let page = 1;
    const { imoveis, qtd } = await getImoveis(site, browser, queryParams, page);

    const pages = Math.ceil(qtd / site.itemsPerPage);
    console.info(`------- ${site.name} possuí ${pages} páginas`);
    lista = lista.concat(imoveis);

    if (pages === 1 || (queryParams.maxPages && page >= queryParams.maxPages)) {
      return lista;
    }

    for (let currentPage = 2; currentPage <= pages; currentPage++) {
      const { imoveis, page } = await getImoveis(site, browser, queryParams, currentPage);
      console.info(`------- ${site.name} página ${page} de ${pages}`);
      lista.push(...imoveis);
      if (queryParams.maxPages && page >= queryParams.maxPages) {
        return lista;
      }
    }
    return lista;

  } catch (error) {
    console.error(`Erro ao consultar o site ${site.name}: ${error.message} `);
    return lista;
  }
}
