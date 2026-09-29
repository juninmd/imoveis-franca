import { Site } from '../types';

const site: Site = {
  name: 'luanaimoveis',
  url: 'https://www.luanaimoveis.com.br',
  driver: 'axios',
  enabled: false, // The site returns 404 for standard axios, let's keep it disabled for now as per memory. "Direct Axios requests to specific location routes on some Kenlo platform sites (e.g., luanaimoveis.com.br/imoveis/a-venda/franca) may be blocked by WAF/bot protection (GoCache) returning 404s, requiring the scraper to be disabled or approach the scraping via a different strategy."
  itemsPerPage: 10,
  getPaginateParams: (page: number) => {
    return {
      path: `/imoveis/a-venda/franca?pagina=${page}`,
    };
  },
  adapter: async () => {
    return {
        imoveis: [],
        qtd: 0,
    };
  }
};

export default site;
