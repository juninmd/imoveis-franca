import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://oasisimobiliaria.com.br/?page_id=2675&finalidade=comprar',
  name: 'oasisimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 9,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://oasisimobiliaria.com.br/?page_id=2675&finalidade=comprar&paged=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const qtdText = $('p.mono:contains("Exibindo")').text() || $('p:contains("Exibindo")').text() || $('div:contains("Exibindo")').text();
  const qtdMatch = qtdText.match(/de\s+(\d+)\s+imóveis/i) || qtdText.match(/de\s+(\d+)\s+resultados/i);
  let qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const items = $('a.card, a.card-imovel, div.card');

  items.each((_i, el) => {
    const linkAttr = $(el).attr('href') || $(el).find('a').attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://oasisimobiliaria.com.br${linkAttr.startsWith('/') ? linkAttr : '/' + linkAttr}`;

    const titulo = $(el).find('h3').text().trim();
    if (!titulo) return;

    const locationStr = $(el).find('.loc').text().trim() || $(el).find('p.card-location').text().trim();
    const endereco = normalizeNeighborhoodName(locationStr);

    const priceText = $(el).find('.price').text().trim() || $(el).find('div.card-price').text().trim();
    const isRental = priceText.includes('/mês');
    const valor = parseFloat(priceText.replace('R$', '').replace('/mês', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    const details = $(el).find('.specs span, div.card-meta div.item').map((_, s) => $(s).text().trim()).get();

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    details.forEach(detail => {
       const text = detail.toLowerCase();
       if (text.includes('m²')) {
           area = parseFloat(text.replace('m²', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
       } else if (text.includes('dorm') || text.includes('quarto') || text.includes('suíte')) {
           quartos += parseInt(text) || 0;
       } else if (text.includes('banh')) {
           banheiros += parseInt(text) || 0;
       } else if (text.includes('vaga')) {
           vagas += parseInt(text) || 0;
       }
    });

    const imgEl = $(el).find('img.photo-img, img.lazyload, img').first();
    let imgUrl = imgEl.attr('data-src') || imgEl.attr('src');
    if (imgUrl && imgUrl.startsWith('data:image')) {
      imgUrl = imgEl.attr('data-lazy-src') || imgEl.attr('data-opt-src') || imgUrl;
    }
    const imagens = imgUrl ? [imgUrl.startsWith('http') || imgUrl.startsWith('data:') ? imgUrl : `https://oasisimobiliaria.com.br${imgUrl}`] : [];

    if (!isRental && link && valor > 0) {
        imoveis.push({
            titulo,
            descricao: '',
            imagens,
            endereco,
            valor,
            area,
            areaTotal: area,
            quartos,
            link,
            banheiros,
            vagas,
            precoPorMetro: area > 0 ? valor / area : 0,
            site: 'oasisimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}
