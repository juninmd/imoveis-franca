import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://imoveisfranca.com.br/comprar',
  name: 'imoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 20,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://imoveisfranca.com.br/comprar/${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;
  const paginationLinks = $('.pagination a');
  let lastPage = 1;
  paginationLinks.each((_, el) => {
     const t = $(el).text().trim();
     const p = parseInt(t, 10);
     if(!isNaN(p) && p > lastPage) {
       lastPage = p;
     }
  });
  if (lastPage > 1) {
      qtd = lastPage * 20;
  }

  const items = $('.card-resultado').length ? $('.card-resultado') : $('a.link-resultado');
  if (qtd === 0 && items.length > 0) {
      qtd = items.length;
  }

  items.each((_, el) => {
     let parent = $(el).hasClass('link-resultado') ? $(el).parent() : $(el);
     if (parent.get(0) && parent.get(0).tagName && parent.get(0).tagName.toLowerCase() === 'a' && $(el).hasClass('card-resultado') === false) {
       parent = $(el);
     }

     const titleNode = parent.find('.titulo-resultado-busca').length ? parent.find('.titulo-resultado-busca') : parent.find('h5');
     let title = titleNode.text().trim();
     if (!title) {
        title = parent.find('div.titulo-resultado-busca').text().trim();
     }
     if (!title) return;

     let link = parent.find('a.link-resultado').attr('href');
     if (!link && $(el).hasClass('link-resultado')) link = $(el).attr('href');
     if (!link) link = parent.find('a').attr('href');
     if (!link) link = '';

     const image = parent.find('img').first().attr('src') || '';

     const text = parent.text();
     const mBed = text.match(/(\d+)\s*Quartos/i);
     const bed = mBed ? parseInt(mBed[1], 10) : 0;
     const mBath = text.match(/(\d+)\s*Banheiros/i);
     const bath = mBath ? parseInt(mBath[1], 10) : 0;
     const mCar = text.match(/(\d+)\s*Vagas/i);
     const garage = mCar ? parseInt(mCar[1], 10) : 0;

     let area = 0;
     const mArea = text.match(/(\d+)\s*m²/i);
     if (mArea) area = parseInt(mArea[1], 10);

     const htmlStr = parent.html() || '';
     const pmatch2 = htmlStr.match(/R\$\s*[\d.,]+/);
     let priceStr = pmatch2 ? pmatch2[0] : '';
     if (!priceStr) {
         parent.find('.lista-precos .item-lista-precos').each((_, pEl) => {
             const pt = $(pEl).find('.item-lista-titulo').text().trim().toLowerCase();
             const pv = $(pEl).find('.item-lista-valor').text().trim();
             if (pt.includes('venda') && pv && !pv.toLowerCase().includes('solicitar') && !pv.toLowerCase().includes('consulte')) {
                 priceStr = pv;
             }
         });
     }

     priceStr = priceStr.replace('R$', '').trim();
     const valor = getFixValue(priceStr);

     let endereco = '';
     const endNode = parent.find('.endereco-resultado-busca');
     if (endNode.length) {
         endereco = normalizeNeighborhoodName(endNode.text().trim().split(',')[0]);
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
         link,
         precoPorMetro: area > 0 ? valor / area : 0,
         site: 'imoveisfranca.com.br',
         entrada: valor * 0.20
       });
     }
  });

  return { imoveis, qtd, html };
}
