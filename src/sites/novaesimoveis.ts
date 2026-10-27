
import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.novaesimoveis.com.br/imoveis/a-venda',
  name: 'novaesimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  waitFor: '.card, a[href*="imovel"]',
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.novaesimoveis.com.br/imoveis/a-venda?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;

  const items = $('a[href*="imovel/"]');
  const addedLinks = new Set();

  if (qtd === 0 && items.length > 0) {
      qtd = items.length;
  }

  const paginationLinks = $('.pagination a, nav a').filter((_, el) => !isNaN(parseInt($(el).text().trim(), 10)));
  let lastPage = 1;
  paginationLinks.each((_, el) => {
     const t = $(el).text().trim();
     const p = parseInt(t, 10);
     if(!isNaN(p) && p > lastPage) {
       lastPage = p;
     }
  });
  if (lastPage > 1 && qtd > 0) {
      qtd = lastPage * qtd;
  }

  items.each((_, el) => {
     let parent = $(el).parent();
     if (parent.text().length < 50) {
        parent = $(el);
     }

     const link = $(el).attr('href');
     if (!link) return;
     if (addedLinks.has(link)) return;

     const titleNode = parent.find('h2, h3, h4').first();
     let title = titleNode.text().trim();
     if (!title) {
        title = parent.text().substring(0, 100).replace(/\n/g, ' ').trim();
     }

     const image = parent.find('img').first().attr('src') || '';

     const text = parent.text();
     const mBed = text.match(/(\d+)\s*(Quartos?|Dorms?|Su[íi]tes?)/i);
     const bed = mBed ? parseInt(mBed[1], 10) : 0;
     const mBath = text.match(/(\d+)\s*(Banheiros?|Wcs?|Banhs?)/i);
     const bath = mBath ? parseInt(mBath[1], 10) : 0;
     const mCar = text.match(/(\d+)\s*(Vagas?|Garagens?)/i);
     const garage = mCar ? parseInt(mCar[1], 10) : 0;

     let area = 0;
     const mArea = text.match(/(\d+)\s*(m²|m2|metros)/i);
     if (mArea) area = parseInt(mArea[1], 10);

     const htmlStr = parent.html() || '';
     const pmatch2 = htmlStr.match(/R\$\s*[\d.,]+/);
     let priceStr = pmatch2 ? pmatch2[0] : '';
     if (!priceStr) {
         const pt = parent.text();
         const ptMatch = pt.match(/R\$\s*[\d.,]+/);
         if (ptMatch) priceStr = ptMatch[0];
     }

     priceStr = priceStr.replace('R$', '').trim();
     const valor = getFixValue(priceStr);

     let endereco = '';
     const endNode = parent.find('address, p, span').filter((_, e) => $(e).text().includes(','));
     if (endNode.length) {
         endereco = normalizeNeighborhoodName(endNode.first().text().trim().split(',')[0]);
     }

     if (valor > 0 && link && link.includes('imovel')) {
       addedLinks.add(link);
       imoveis.push({
         titulo: title,
         descricao: '',
         imagens: [image].filter(Boolean),
         endereco,
         valor,
         area,
         areaTotal: area,
         quartos: bed,
         banheiros: bath,
         vagas: garage,
         link: link.startsWith('http') ? link : `https://www.novaesimoveis.com.br${link}`,
         precoPorMetro: area > 0 ? valor / area : 0,
         site: 'novaesimoveis.com.br',
         entrada: valor * 0.20
       });
     }
  });

  return { imoveis, qtd, html };
}
