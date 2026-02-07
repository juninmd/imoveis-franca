import qs from 'qs';
import RedisConnection from '../infra/redis';
import { Site, BaseQueryParams } from '../types';
import { retrieveContent } from './retrieve-page-content';

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
    const cacheKey = `${link}-${JSON.stringify(site.payload)}`;

    const cachedSite = await RedisConnection.getKey<any>(`content-${cacheKey}`);
    if (cachedSite) {
      const { imoveis, qtd, html, json } = cachedSite;
      return { imoveis, qtd, page, html, json };
    }

    const content = await retrieveContent(link, site, params);
    console.info(link, site.driver);

    const { imoveis, qtd, html, json } = (await site.adapter(content));

    if (imoveis.length > 0) {
      await RedisConnection.setKey(`content-${link}`, { imoveis, qtd, page, html, json }, 600);
    }

    return { imoveis, qtd, page, html, json };
  } catch (error) {
    console.error(`Retry ${site.url}`, error);
    return await getImoveis(site, params, baseQueryParams, page);
  }
}