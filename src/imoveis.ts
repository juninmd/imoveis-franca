// Importar as bibliotecas necessárias
import qs from 'qs';
import axios from 'axios';
import { getNewPage, puppetAdapter } from './puppeter';
import { Imoveis, Site, sites } from './sites';
import { Browser } from 'puppeteer';
import { retrieImoveisSite } from './generate-imoveis';

export const filterImoveis = (imoveis: Imoveis[], queryParams) => {
  const { maxPrice, minPrice, quartos, minArea, maxArea } = queryParams;
  return imoveis.filter(imovel => {
    return imovel.valor >= minPrice && imovel.valor <= maxPrice
      && imovel.areaTotal >= minArea && imovel.areaTotal <= maxArea
      && imovel.quartos >= quartos;
  });
};

export const sortImoveis = (imoveis: any[]) => {
  return imoveis.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

export const gerarLista = async () => {
  // Definir os parâmetros de busca
  const queryParams = {
    minPrice: 100000,
    maxPrice: 300000,
    quartos: 2,
    minArea: 50,
    maxArea: 250,
    maxPages: undefined,
  };

  let lista: Imoveis[] = [];

  const browser = await puppetAdapter();
  const promsies: any[] = [];
  for (const site of sites.filter(q => q.enabled)) {
    promsies.push(retrieImoveisSite(site, browser, queryParams));
  }

  const promisesResolved: Imoveis[][] = await Promise.all(promsies);
  lista = lista.concat(...promisesResolved);

  await browser.close();
  // lista = filterImoveis(lista, queryParams);
  lista = sortImoveis(lista);
  return lista;
};

const cache = {};

export async function getImoveis(site: Site, browser: Browser, queryParams, page: number) {
  try {
    const cacheKey = `${site.url}-${page}-${JSON.stringify(queryParams)}`;

    // Verificar se a resposta já está em cache
    if (cache[cacheKey]) {
      console.log('Retornando resultado do cache para:', cacheKey);
      return cache[cacheKey];
    }

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

    // Armazenar a resposta em cache
    cache[cacheKey] = { imoveis, qtd, page };
    return { imoveis, qtd, page };
  } catch (error) {
    console.error(`Retry ${site.url}`, error);
    throw error;
  }
}

async function retrieveHtml(browser: Browser, url: string, site: Site) {
  if (site.driver === 'puppet') {
    const page = await getNewPage(browser);

    await page.goto(url.trim(), { timeout: 20000, waitUntil: 'domcontentloaded' });

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