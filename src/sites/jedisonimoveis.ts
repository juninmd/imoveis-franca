import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.jedisonimoveis.com.br/imoveis/a-venda/franca',
  name: 'jedisonimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.jedisonimoveis.com.br/imoveis/a-venda/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  let qtd = 0;

  const items = $('.box_imovel');
  if (qtd === 0 && items.length > 0) {
      // Find pagination
      const lastPageLink = $('.paginacao a').last().attr('href');
      if (lastPageLink) {
         const m = lastPageLink.match(/pagina=(\d+)/);
         if (m) {
             qtd = parseInt(m[1], 10) * 12;
         }
      }
      if (qtd === 0) qtd = items.length;
  }

  items.each((_, el) => {
      const title = $(el).find('h2.titulo_imovel, .titulo_imovel').text().trim() || 'Imóvel';

      const priceStr = $(el).find('.valor_imovel, .preco').text().trim();
      const valorStr = priceStr.replace(/[^\d,.]/g, '').replace(/\./g, '');
      const valor = getFixValue(valorStr);

      const image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src') || '';

      const text = $(el).text();
      const mBed = text.match(/(\d+)\s*Quarto/i) || text.match(/(\d+)\s*Dormitório/i);
      const bed = mBed ? parseInt(mBed[1], 10) : 0;

      const mBath = text.match(/(\d+)\s*Banheiro/i) || text.match(/(\d+)\s*Suite/i) || text.match(/(\d+)\s*Suíte/i);
      const bath = mBath ? parseInt(mBath[1], 10) : 0;

      const mCar = text.match(/(\d+)\s*Vaga/i);
      const garage = mCar ? parseInt(mCar[1], 10) : 0;

      let area = 0;
      const mArea = text.match(/(\d+)\s*m²/i);
      if (mArea) area = parseInt(mArea[1], 10);

      const endStr = $(el).find('.bairro_imovel, .endereco_imovel').text().trim();
      const endereco = normalizeNeighborhoodName(endStr.split('-')[0].trim());

      const href = $(el).find('a').attr('href');
      const link = href ? (href.startsWith('http') ? href : `https://www.jedisonimoveis.com.br${href}`) : 'https://www.jedisonimoveis.com.br/link';

      if (valor > 0) {
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
            site: 'jedisonimoveis.com.br',
            entrada: valor * 0.20
          });
      }
  });

  return { imoveis, qtd, html };
}
