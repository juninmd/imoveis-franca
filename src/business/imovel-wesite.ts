import { Site, BaseQueryParams } from '../types';
import { retrieImoveisSiteByParams } from './calculate-pages';

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
