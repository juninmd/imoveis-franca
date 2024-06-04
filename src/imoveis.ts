import qs from 'qs';
import axios from 'axios';
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

export const generateList = async (query) => {
  const baseQueryParams: BaseQueryParams = {
    minPrice: 1,
    maxPrice: 500000,
    quartos: 2,
    minArea: 50,
    maxArea: 250,
    maxPages: undefined,
  };

  let lista: Imoveis[] = [];

  const promsies: any[] = [];

  for (const site of sites.filter(q => q.enabled)) {
    const cacheKey: Imoveis[] = await RedisConnection.getKey(site.name);
    if (cacheKey) {
      lista = lista.concat(cacheKey);
      continue;
    }
    promsies.push(retrieImoveisSite(site, baseQueryParams));
  }

  const promisesResolved: Imoveis[][] = await Promise.all(promsies);

  for (const promise of promisesResolved) {
    await RedisConnection.setKey(promise[0].site, promise);
  }

  lista = lista.concat(...promisesResolved);
  lista = filterImoveis(lista, query);
  lista = sortImoveis(lista);
  lista = calcularValorMedioBairroPorAreaTotal(lista);
  return lista;
};

export async function getImoveis(site: Site, params = undefined, baseQueryParams: BaseQueryParams, page: number) {
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
    const content = await retrieveContent(link, site, params);
    console.info(link, site.driver);

    const { imoveis, qtd, html, json } = (await site.adapter(content));

    await RedisConnection.setKey(`content-${link}`, html || json);

    return { imoveis, qtd, page };
  } catch (error) {
    console.error(`Retry ${site.url}`, error);
    return await getImoveis(site, params, baseQueryParams, page);
  }
}

export async function retrieveContent(url: string, site: Site, params = undefined) {
  if (site.driver === 'puppet') {
    const page = await browser.getNewPage();

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
    lista.push(...imoveis);
    const pages = Math.ceil(qtd / site.itemsPerPage);
    console.info(`------- ${site.name} possuí ${pages} páginas`);

    if (pages === 1 || (baseQueryParams.maxPages && page >= baseQueryParams.maxPages)) {
      return lista;
    }

    for (let currentPage = 2; currentPage <= pages; currentPage++) {
      const { imoveis, page } = await getImoveis(site, params, baseQueryParams, currentPage);
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