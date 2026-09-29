// import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
// import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.agessani.com.br/imoveis/venda', // Example URL
  name: 'agessani.com',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (_page: number) => {
    return { url: `https://www.agessani.com.br/imoveis/venda?page=${_page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  // const $ = cheerio.load(html);

  // Return empty array to be safe in case of block/404, but structurally sound
  return { imoveis, qtd: imoveis.length, html };
}
