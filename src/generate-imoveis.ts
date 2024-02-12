import { getImoveis } from './imoveis';
import { Site } from './sites';

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
