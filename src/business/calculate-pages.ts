import { Site, BaseQueryParams, Imoveis } from '../types';
import { getImoveis } from './retriveve-page';

export const retrieImoveisSiteByParams = async (site: Site, params = undefined, baseQueryParams: BaseQueryParams) => {
  try {
    const lista: Imoveis[] = [];
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
