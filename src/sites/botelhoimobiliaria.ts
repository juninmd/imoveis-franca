import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.botelhoimobiliaria.com.br/imoveis.php?negocio=venda',
  name: 'botelhoimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.botelhoimobiliaria.com.br/imoveis.php?negocio=venda&page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*opções encontradas/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  const items = $('.group.cursor-pointer, a.group, a[href*="imovel.php"], div[onclick*="imovel.php"]');

  items.each((_i, el) => {
    const titulo = $(el).find('h4').text().trim() || $(el).find('.font-black').first().text().trim();
    if (!titulo) return;

    // Address - check elements with location_on text
    const locationSpan = $(el).find('.material-symbols-outlined:contains("location_on")');
    let locationStr = '';

    if (locationSpan.length > 0) {
        // the text immediately following the span might be wrapped or just a text node
        // getting text of parent and removing 'location_on' works if it's the only other text
        const parentHtml = locationSpan.parent().html();
        if (parentHtml) {
            const $p = cheerio.load(parentHtml);
            $p('span').remove();
            locationStr = $p.root().text().trim();
        }

        // Sometimes cheerio.load removes text nodes if they aren't inside an element
        if (!locationStr) {
           const parentText = locationSpan.parent().text();
           locationStr = parentText.replace('location_on', '').trim();
        }
    }

    // Fallback if empty or too long
    if (!locationStr || locationStr.length > 50) {
       locationStr = locationSpan.parent().text().replace('location_on', '').split('\n')[0].trim();
    }

    // Safety fallback
    if (!locationStr || locationStr.length > 50 || locationStr.includes('invalid node')) {
        locationStr = titulo;
    }

    const endereco = normalizeNeighborhoodName(locationStr);

    // Price
    const priceText = $(el).find('.text-primary.font-black.text-2xl, .text-primary').first().text().replace(/[\n\t]/g, '').trim().split('/')[0].replace('location_on', '').trim();
    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    // Details
    const details = $(el).find('.flex-wrap.gap-2 span').map((_, s) => $(s).text().trim()).get();

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    details.forEach(detail => {
       const text = detail.toLowerCase();
       if (text.includes('m²')) {
           area = parseFloat(text.replace('m²', '').trim()) || 0;
       } else if (text.includes('quarto')) {
           quartos = parseInt(text) || 0;
       } else if (text.includes('banh')) {
           banheiros = parseInt(text) || 0;
       } else if (text.includes('vaga')) {
           vagas = parseInt(text) || 0;
       }
    });

    const linkAttr = $(el).attr('href') || $(el).closest('a').attr('href') || $(el).attr('onclick');
    let link = '';
    if (linkAttr) {
        let l = linkAttr;
        if (l.includes("window.location='")) {
            l = l.replace("window.location='", "").replace("'", "");
        }
        link = l.startsWith('http') ? l : `https://www.botelhoimobiliaria.com.br/${l}`;
    }

    const imgRel = $(el).find('img').attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.botelhoimobiliaria.com.br/${imgRel}`] : [];

    const isRental = details.some(d => d.toUpperCase().includes('LOCAÇÃO'));
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
            site: 'botelhoimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
