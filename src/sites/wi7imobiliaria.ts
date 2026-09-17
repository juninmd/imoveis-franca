import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.wi7imobiliaria.com.br/imoveis/venda/franca',
  name: 'wi7imobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.wi7imobiliaria.com.br/imoveis/venda/franca/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;
  const paginationLinks = $('.pagination a[href]');
  if (paginationLinks.length > 0) {
      const lastPageLink = paginationLinks.last().attr('href');
      if (lastPageLink) {
          const match = lastPageLink.match(/pagina-(\d+)/);
          if (match) {
              const pages = parseInt(match[1], 10);
              if (!isNaN(pages)) {
                  qtd = pages * 12; // Approximation
              }
          }
      }
  }

  if (qtd === 0 && $('.thumbnail.recent-properties-box').length > 0) {
      qtd = $('.thumbnail.recent-properties-box').length;
  }

  $('.thumbnail.recent-properties-box').each((_, el) => {
      const titleNode = $(el).find('.detail h1 a');
      const locationNode = $(el).find('.location a').text().trim();

      const title = titleNode.text().trim() + (locationNode ? ` em ${locationNode}` : '');
      let priceStr = $(el).find('.price').text().trim();
      priceStr = priceStr.replace('R$', '').trim();
      const link = titleNode.attr('href') || $(el).find('a').attr('href') || '';
      const image = $(el).find('img').attr('src') || '';

      let bed = 0; let bath = 0; let garage = 0;
      $(el).find('.facilities-list li').each((_, fac) => {
          const t = $(fac).text().toLowerCase();
          const num = parseInt(t.replace(/\D/g, ''), 10) || 0;
          if (t.includes('quarto')) bed = num;
          if (t.includes('banheiro')) bath = num;
          if (t.includes('garagem') || t.includes('vaga')) garage = num;
      });

      const valor = getFixValue(priceStr);

      if (valor > 0 && link) {
          imoveis.push({
              titulo: title,
              descricao: '',
              imagens: [image].filter(Boolean),
              endereco: normalizeNeighborhoodName(locationNode),
              valor,
              area: 0,
              areaTotal: 0,
              quartos: bed,
              banheiros: bath,
              vagas: garage,
              link,
              precoPorMetro: 0,
              site: 'wi7imobiliaria.com.br',
              entrada: valor * 0.20
          });
      }
  });

  /* istanbul ignore next */
  return { imoveis: imoveis || [], qtd, html };
}
