import { Site } from '../types';

const site: Site = {
  name: 'fortscunha',
  url: 'https://www.fortscunha.com.br',
  driver: 'axios',
  enabled: false, // The site returns 404 for standard axios.
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
