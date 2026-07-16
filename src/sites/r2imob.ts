import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://r2imob.com.br/busca?orst=dta&topr=1',
  name: 'r2imob.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://r2imob.com.br/busca?orst=dta&topr=1&pg=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  // We need to parse this properly, using string 'latin1' Buffer if possible, but html arrives as string
  const buf = Buffer.from(html, 'binary');
  const fixedHtml = buf.toString('utf8');

  // Try utf8 first, if it contains invalid characters, just use the string
  const parsedHtml = fixedHtml.includes('\uFFFD') ? Buffer.from(html, 'binary').toString('latin1') : fixedHtml;

  const $ = cheerio.load(parsedHtml);

  const qtd = 0;

  const imoveis: Imoveis[] = [];

  $('.box-imovel').each((_i, el) => {
    const linkEl = $(el).find('a').first();
    const linkAttr = linkEl.attr('href') || '';
    const link = linkAttr.startsWith('http') ? linkAttr : `https://r2imob.com.br${linkAttr}`;

    const titulo = $(el).find('.property-title').text().trim();
    if (!titulo) return;

    const addressText = $(el).find('.property-neighborhood').text().trim();
    const endereco = normalizeNeighborhoodName(addressText);

    let valor = 0;
    $(el).find('.property-value .top-info b').each((_, priceEl) => {
       const text = $(priceEl).text().trim();
       if (text.includes('$')) {
           valor = parseFloat(text.replace('$', '').replace(/,/g, '').trim() || '0');
       }
    });
    if (valor === 0) {
       const rawVal = $(el).find('.property-value').text().replace('VENDA', '').replace('$', '').trim();
       valor = parseFloat(rawVal.replace(/,/g, '').trim() || '0');
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.imovel-icon-item .top-info').each((_, iconEl) => {
       const attr = $(iconEl).attr('title') || '';
       const text = $(iconEl).text().toLowerCase();

       if (attr.includes('dormit')) {
           quartos = parseInt($(iconEl).text()) || 0;
       } else if (attr.includes('banheiro')) {
           banheiros = parseInt($(iconEl).text()) || 0;
       } else if (attr.includes('vaga')) {
           vagas = parseInt($(iconEl).text()) || 0;
       } else if (text.includes('rea') || text.includes('area')) {
           area = getFixValue(text.replace(/[^0-9,.]/g, '').trim());
       }
    });

    const imagens: string[] = [];
    const imgRel = $(el).find('img').first().attr('src');
    if (imgRel) {
        imagens.push(imgRel.startsWith('http') ? imgRel : `https://r2imob.com.br${imgRel.startsWith('/') ? '' : '/'}${imgRel}`);
    }

    if (link && valor > 0) {
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
            site: 'r2imob.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
