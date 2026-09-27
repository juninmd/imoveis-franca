import { Site } from '../types';

const site: Site = {
  name: 'luanaimoveis',
  driver: 'axios',
  enabled: false,
  url: 'https://www.luanaimoveis.com.br/imoveis/a-venda/franca',
  itemsPerPage: 12,
  getPaginateParams: (_page) => ({}),
  adapter: async (_html: string) => {
    return {
      qtd: 0,
      imoveis: [],
    };
  }
};

export default site;
