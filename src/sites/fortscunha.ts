import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/imoveis?pretensao=venda',
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.fortscunha.com.br/imoveis?pretensao=venda&page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;

  if ($('.pagination li a').length > 0) {
    const lastPageLink = $('.pagination li a').eq(-2).text().trim();
    const pages = parseInt(lastPageLink, 10);
    if (!isNaN(pages)) {
       qtd = pages * 12; // Approximation
    }
  }

  if (qtd === 0 && $('.single-project').length > 0) {
      qtd = $('.single-project').length;
  }

  $('.single-project').each((_, el) => {
     const titleNode = $(el).find('h5 a');
     const locationStr = $(el).find('.lower-content').text().split('Franca -')[1]?.split('\n')[0]?.trim() || '';

     const title = titleNode.text().trim() + (locationStr ? ` em ${locationStr}` : '');
     let priceStr = $(el).find('.valor-pacote').text().trim();
     priceStr = priceStr.replace('R$', '').trim();
     const link = titleNode.attr('href') || $(el).find('a').attr('href') || '';
     const image = $(el).find('img').attr('src') || '';

     let bed = 0; let bath = 0; let garage = 0; let area = 0;
     $(el).find('.valores-imovel').each((_, fac) => {
         const hasBed = $(fac).find('.fa-bed').length > 0;
         const hasBath = $(fac).find('.fa-bath').length > 0;
         const hasCar = $(fac).find('.fa-car').length > 0;
         const hasArea = $(fac).find('.fa-arrows').length > 0;

         const text = $(fac).text().replace(/[^\d.,]/g, '').trim();
         const num = parseInt(text, 10) || 0;

         if (hasBed) bed = num;
         if (hasBath) bath = num;
         if (hasCar) garage = num;
         if (hasArea) area = num;
     });

     const valor = getFixValue(priceStr);

     if (valor > 0 && link) {
       imoveis.push({
         titulo: title,
         descricao: '',
         imagens: [image].filter(Boolean),
         endereco: normalizeNeighborhoodName(locationStr),
         valor,
         area,
         areaTotal: 0,
         quartos: bed,
         banheiros: bath,
         vagas: garage,
         link,
         precoPorMetro: area > 0 ? valor / area : 0,
         site: 'fortscunha.com.br',
         entrada: valor * 0.20
       });
     }
  });

  return { imoveis, qtd, html };
}
