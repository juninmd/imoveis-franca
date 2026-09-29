import { Imoveis, Site } from '../types';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/venda', // Example URL
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (_page: number) => {
    return { url: `https://www.fortscunha.com.br/venda?page=${_page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  return { imoveis, qtd: imoveis.length, html };
}
