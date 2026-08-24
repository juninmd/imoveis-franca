import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export const adapter = async (html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> => {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const cards = $('.imovelcard');
  const qtd = cards.length;

  cards.each((_, el) => {
    try {
      const linkEl = $(el).find('a').attr('href') ? $(el).find('a') : $(el);
      const href = linkEl.attr('href') || $(el).attr('data-link');

      if (!href || !href.includes('/imovel/')) return;

      const fullLink = href.startsWith('http') ? href : `https://www.unicafrancaimoveis.com.br${href}`;

      const tituloEl = $(el).find('.imovelcard__info__local');
      const titulo = (tituloEl.length ? tituloEl : $(el).find('.card-title, .titulo, h2').first()).text().trim().toUpperCase();
      const valorRaw = $(el).find('.imovelcard__valor__valor, .card-price, .preco, .valor, [class*="price"]').text();
      const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

      const enderecoEl = $(el).find('.imovelcard__info__local');
      const enderecoRaw = (enderecoEl.length ? enderecoEl : $(el).find('.card-address, .endereco, .bairro, [class*="address"]')).text().trim();
      const endereco = normalizeNeighborhoodName(enderecoRaw);

      const img = $(el).find('img').first().attr('src') || '';

      if (titulo || valor > 0 || img) {
         imoveis.push({
            site: 'unicafrancaimoveis.com.br',
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

const unicafrancaimoveis: Site = {
  driver: 'axios',
  enabled: true,
  tipo: 'venda',
  name: 'unicafrancaimoveis.com.br',
  url: 'https://www.unicafrancaimoveis.com.br/imovel/?finalidade=venda',
  itemsPerPage: 12,
  adapter,
  translateParams: {
    currentPage: 'pag',
    maxPrice: undefined,
    minPrice: undefined,
  },
  getPaginateParams: (page: number) => { return { params: { pag: page } }; }
};

export default unicafrancaimoveis;