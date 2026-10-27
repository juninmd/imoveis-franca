
import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://imobiliariapereira.com.br/imoveis',
  name: 'imobiliariapereira.com.br',
  driver: 'puppet',
  itemsPerPage: 30,
  waitFor: '.card-imovel',
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://imobiliariapereira.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;

  // Imobzi / Angular base
  const items = $('.card-imovel');
  if (qtd === 0 && items.length > 0) {
      qtd = items.length;
  }

  // try to find quantity via next page
  const pags = $('.pagination li a, pagination-controls a');
  let lastPage = 1;
  pags.each((_, el) => {
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
     const titleNode = $(el).find('h3, .title_value, .mat-mdc-card-title');
     const title = titleNode.text().trim();
     if (!title) return;

     let link = $(el).find('a').first().attr('href');
     if (!link) link = '';

     const image = $(el).find('img').first().attr('src') || '';

     const text = $(el).text();
     const mBed = text.match(/(\d+)\s*Quartos/i) || text.match(/(\d+)\s*suites?/i) || text.match(/(\d+)\s*dorm/i);
     const bed = mBed ? parseInt(mBed[1], 10) : 0;
     const mBath = text.match(/(\d+)\s*Banheiros?/i);
     const bath = mBath ? parseInt(mBath[1], 10) : 0;
     const mCar = text.match(/(\d+)\s*Vagas?/i);
     const garage = mCar ? parseInt(mCar[1], 10) : 0;

     let area = 0;
     const mArea = text.match(/(\d+)\s*m²/i);
     if (mArea) area = parseInt(mArea[1], 10);

     const htmlStr = $(el).html() || '';
     const pmatch2 = htmlStr.match(/R\$\s*[\d.,]+/);
     let priceStr = pmatch2 ? pmatch2[0] : '';

     priceStr = priceStr.replace('R$', '').trim();
     const valor = getFixValue(priceStr);

     let endereco = '';
     const endNode = $(el).find('.mat-mdc-card-subtitle, .subtitle-description, p');
     if (endNode.length) {
         endereco = normalizeNeighborhoodName(endNode.first().text().trim().split(',')[0]);
     }

     if (valor > 0 && link) {
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
         link: link.startsWith('http') ? link : `https://imobiliariapereira.com.br${link}`,
         precoPorMetro: area > 0 ? valor / area : 0,
         site: 'imobiliariapereira.com.br',
         entrada: valor * 0.20
       });
     }
  });

  return { imoveis, qtd, html };
}
