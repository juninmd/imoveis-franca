import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  // ecid=9144 = Franca (o site mistura outras cidades). A paginacao (p=N) depende de sessao (JSESSIONID):
  // sem cookie so a primeira pagina retorna itens, entao paginas > 1 voltam vazias.
  url: 'https://r2imob.com.br/busca?orst=dta&topr=1&ecid=9144',
  name: 'r2imob.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    const base = 'https://r2imob.com.br/busca?orst=dta&topr=1&ecid=9144';
    return { url: page <= 1 ? base : `${base}&p=${page - 1}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  // O driver decodifica o latin1 do site como utf8, entao acentos viram U+FFFD; removemos.
  const $ = cheerio.load(html.replace(/\uFFFD/g, ''));

  const qtdMatch = $('body').text().match(/Localizados\s+(\d+)/i);
  const qtd = qtdMatch ? parseInt(qtdMatch[1], 10) : 0;

  const imoveis: Imoveis[] = [];

  $('.box-imovel').each((_i, el) => {
    const linkEl = $(el).find('a').first();
    const linkAttr = linkEl.attr('href') || '';
    const link = linkAttr.startsWith('http') ? linkAttr : `https://r2imob.com.br${linkAttr}`;

    const titulo = $(el).find('.property-title').text().replace(/\s+/g, ' ').trim();
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
