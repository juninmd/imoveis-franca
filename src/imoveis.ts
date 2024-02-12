// Importar as bibliotecas necessárias
import qs from 'qs';
import axios from 'axios';
import { getNewPage, puppetAdapter } from './puppeter';
import { Imoveis, Sites, sites } from './sites';
import { Browser } from 'puppeteer';

const filtrarImoveis = (imoveis: Imoveis[], queryParams) => {
  const { maxPrice, minPrice, quartos, minArea, maxArea } = queryParams;
  return imoveis.filter(imovel => {
    return imovel.valor >= minPrice && imovel.valor <= maxPrice
      && imovel.areaTotal >= minArea && imovel.areaTotal <= maxArea
      && imovel.quartos >= quartos;
  });
};

const ordenarImoveis = (imoveis: any[]) => {
  return imoveis.sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};

export const gerarLista = async () => {
  // Definir os parâmetros de busca
  const queryParams = {
    minPrice: 100000,
    maxPrice: 150000,
    quartos: 2,
    minArea: 50,
    maxArea: 130,
    maxPage: undefined,
  }

  let lista: Imoveis[] = [];

  const browser = await puppetAdapter();
  for (const site of sites.filter(q => q.enabled)) {
    try {
      let page = 1;
      const { imoveis, qtd } = await getImoveis(site, browser, queryParams, page);

      const pages = Math.ceil(qtd / site.itemsPerPage);
      console.info(`------- ${site.name} possuí ${pages} páginas`);
      lista = lista.concat(imoveis);

      if (pages === 1) {
        continue;
      }

      for (let currentPage = 2; currentPage <= pages; currentPage++) {
        const { imoveis, page } = await getImoveis(site, browser, queryParams, currentPage);
        console.info(`------- ${site.name} página ${page} de ${pages}`);
        lista.push(...imoveis);
      }

    } catch (error) {
      console.error(`Erro ao consultar o site ${site.name}: ${error.message} `);
    }
  }

  await browser.close();
  lista = filtrarImoveis(lista, queryParams);
  lista = ordenarImoveis(lista);
  return lista;
};

const cache = {};

async function getImoveis(site: Sites, browser: Browser, queryParams, page: number) {
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
    imoveis.forEach(q => q.link = link);

    // Armazenar a resposta em cache
    cache[cacheKey] = { imoveis, qtd, page };
    return { imoveis, qtd, page };
  } catch (error) {
    console.error(`Retry ${site.url}`, error);
    throw error;
  }
}

async function retrieveHtml(browser: Browser, url: string, site: Sites) {
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