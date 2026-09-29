import { Site } from '../types';

export default {
  enabled: false, // Disabled due to WAF/bot protection returning 404/Empty as per memory
  tipo: 'venda',
  url: 'https://www.luanaimoveis.com.br/imoveis/a-venda/franca',
  name: 'luanaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => ({ url: `https://www.luanaimoveis.com.br/imoveis/a-venda/franca?pagina=${page}` }),
  adapter: async () => ({ imoveis: [], qtd: 0, html: '' }),
} as Site;
