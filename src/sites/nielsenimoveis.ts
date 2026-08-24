import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export const adapter = async (html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> => {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const cards = $('[class*="card"]');
  const qtd = cards.length;

  cards.each((_, el) => {
    try {
      const href = $(el).find('a').attr('href');

      if (!href || !href.includes('/imovel/')) return;

      const fullLink = href.startsWith('http') ? href : `https://www.nielsenimoveis.com.br${href}`;

      const titulo = $(el).find('.card-title, .titulo, h2').first().text().trim().toUpperCase();
      const valorRaw = $(el).find('.card-price, .preco, .valor, [class*="price"]').text();
      const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

      const enderecoRaw = $(el).find('.card-address, .endereco, .bairro, [class*="address"]').text().trim();
      const endereco = normalizeNeighborhoodName(enderecoRaw);

      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src') || '';

      if (titulo || valor > 0 || img) {
         imoveis.push({
            site: 'nielsenimoveis.com.br',
            titulo: titulo || 'IMOVEL',
            descricao: '',
            imagens: [img].filter(Boolean),
            endereco: endereco,
            valor,
            area: 0,
            areaTotal: 0,
            quartos: 0,
            banheiros: 0,
            vagas: 0,
            link: fullLink,
            precoPorMetro: 0,
            entrada: valor * 0.2
        });
      }
    } catch (e) {
      console.warn("Error parsing card", e);
    }
  });

  return { imoveis, qtd, html };
};

const nielsenimoveis: Site = {
  driver: 'axios',
  enabled: true,
  tipo: 'venda',
  name: 'nielsenimoveis.com.br',
  url: 'https://www.nielsenimoveis.com.br/imoveis/a-venda/franca',
  itemsPerPage: 12,
  adapter,
  translateParams: {
    currentPage: 'pagina',
    maxPrice: undefined,
    minPrice: undefined,
  },
  getPaginateParams: (page: number) => { return { params: { pagina: page } }; }
};

export default nielsenimoveis;