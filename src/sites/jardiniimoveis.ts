import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://jardiniimoveis.com.br/imoveis/venda',
  name: 'jardiniimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://jardiniimoveis.com.br/imoveis/venda?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  let qtd = 0;

  const m = $('body').text().match(/(\d+)\s*imóveis?/i);
  if (m) qtd = parseInt(m[1], 10);

  $('[class*="property"], .card, .group').each((_, el) => {
      const title = $(el).find('h2, h3').text().trim();

      const priceStr = $(el).find('p').filter((_, el2) => $(el2).text().includes('R$')).text().trim();
      const valorStr = priceStr.replace(/[^\d,.]/g, '').replace(/\./g, '');
      const valor = getFixValue(valorStr);

      const image = $(el).find('img').attr('src') || '';

      const text = $(el).text();
      const mBed = text.match(/(\d+)\s*(Quarto|Dormitório)/i);
      const bed = mBed ? parseInt(mBed[1], 10) : 0;

      const mBath = text.match(/(\d+)\s*(Banheiro|Suite|Suíte)/i);
      const bath = mBath ? parseInt(mBath[1], 10) : 0;

      const mCar = text.match(/(\d+)\s*Vaga/i);
      const garage = mCar ? parseInt(mCar[1], 10) : 0;

      let area = 0;
      const mArea = text.match(/(\d+)\s*m²/i);
      if (mArea) area = parseInt(mArea[1], 10);

      const endereco = normalizeNeighborhoodName(text.split(',')[0].trim());

      const href = $(el).find('a').attr('href');
      const link = href ? (href.startsWith('http') ? href : `https://jardiniimoveis.com.br${href}`) : 'https://jardiniimoveis.com.br/link';

      if (valor > 0 && title) {
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
            site: 'jardiniimoveis.com.br',
            entrada: valor * 0.20
          });
      }
  });

  return { imoveis, qtd, html };
}
