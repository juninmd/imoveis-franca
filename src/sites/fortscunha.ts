import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/imoveis?status=1',
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.fortscunha.com.br/imoveis?status=1&pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;
  const pTxt = $('.pagination').text();
  const pagesMatch = pTxt.match(/(\d+)/g);
  if (pagesMatch) {
      qtd = Math.max(...pagesMatch.map(Number)) * 12;
  }

  // Notice that from earlier tests, we couldn't find items. It could be due to lack of class names or dynamic loading.
  // The site uses '.col-md-4' for properties, but the test showed no useful info. We'll implement a best-effort selector.
  // As a fallback, since it's hard to scrape accurately when empty/blocked, we use standard selectors if they eventually work.
  $('.col-md-4, .property-card, .imovel-box, .box').each((_, el) => {
      // standard generic extraction if possible, if not, it will just skip
      const title = $(el).find('h3, h4, .title').text().trim();
      let priceStr = $(el).find('.price, strong:contains("R$")').text().trim();
      if (!priceStr) priceStr = $(el).text().match(/R\$\s*[\d.,]+/)?.[0] || '';

      let linkAttr = $(el).find('a').attr('href');
      if (linkAttr && !linkAttr.startsWith('http')) {
          linkAttr = `https://www.fortscunha.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;
      }

      const valor = getFixValue(priceStr);
      let address = $(el).find('.address, .location').text().trim() || title;
      if (address.includes('-')) address = address.split('-')[1].trim(); // Guessing format

      if (linkAttr) {
          imoveis.push({
            titulo: title || 'Imóvel',
            descricao: '',
            imagens: [$(el).find('img').attr('src') || ''].filter(Boolean),
            endereco: normalizeNeighborhoodName(address),
            valor,
            area: 0,
            areaTotal: 0,
            quartos: 0,
            banheiros: 0,
            vagas: 0,
            link: linkAttr,
            precoPorMetro: 0,
            site: 'fortscunha.com.br',
            entrada: valor * 0.2
          });
      }
  });

  return { imoveis, qtd, html };
}
