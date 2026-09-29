import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/imoveis',
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.fortscunha.com.br/imoveis?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;
  const pageLinks = $('.pagination a, a[href*="pagina="], a[href*="pg="], a[href*="p="]');
  if (pageLinks.length > 0) {
      pageLinks.each((_, el) => {
          const text = $(el).text();
          const num = parseInt(text, 10);
          if (!isNaN(num) && num > qtd) qtd = num;
      });
      qtd = qtd * 12; // Approximation
  }
  if (qtd === 0 && $('.single-project').length > 0) {
      qtd = $('.single-project').length;
  }

  $('.single-project').each((_, el) => {
      const titleNode = $(el).find('h5 a');
      const title = titleNode.text().trim();
      const link = titleNode.attr('href') || $(el).find('a').attr('href') || '';
      const locationNode = $(el).find('.lower-content').text();
      let loc = '';
      const locMatch = locationNode.match(/Franca\s*-\s*(.+)/);
      if (locMatch) loc = locMatch[1].trim();

      let priceStr = $(el).find('.valor-pacote').text().trim();
      priceStr = priceStr.replace('R$', '').trim();
      const image = $(el).find('img').attr('src') || '';

      let bed = 0; let bath = 0; let garage = 0;
      $(el).find('.valores-imovel').each((_, fac) => {
          const t = $(fac).text().toLowerCase();
          const htmlContent = $(fac).html() || '';
          const num = parseInt(t.replace(/\D/g, ''), 10) || 0;
          if (htmlContent.includes('fa-bed')) bed = num;
          if (htmlContent.includes('fa-bath')) bath = num;
          if (htmlContent.includes('fa-car')) garage = num;
      });

      const valor = getFixValue(priceStr);

      if (valor > 0 && link) {
          imoveis.push({
              titulo: title + (loc ? ` em ${loc}` : ''),
              descricao: '',
              imagens: [image].filter(Boolean),
              endereco: normalizeNeighborhoodName(loc),
              valor,
              area: 0,
              areaTotal: 0,
              quartos: bed,
              banheiros: bath,
              vagas: garage,
              link,
              precoPorMetro: 0,
              site: 'fortscunha.com.br',
              entrada: valor * 0.20
          });
      }
  });

  /* istanbul ignore next */
  return { imoveis: imoveis || [], qtd, html };
}
