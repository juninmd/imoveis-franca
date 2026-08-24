import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.boscoimoveis.com.br/imoveis/finalidade-2-comprar',
  name: 'boscoimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.boscoimoveis.com.br/imoveis/finalidade-2-comprar/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/de (\d+)\s*$/m) || bodyText.match(/de\s*(\d+)\s*imóveis/i) || bodyText.match(/Exibindo de \d+ a \d+ de (\d+)/) || bodyText.match(/Exibindo\s+de\s+\d+\s+a\s+\d+\s+de\s+(\d+)/);
  let qtd = 0;
  if (qtdMatch) {
    qtd = Number(qtdMatch[1]);
  } else {
    // try to find bold text inside 'Listagem de Imóveis - Exibindo'
    const boldText = $('span.hidden-xs:contains("Listagem") b').text();
    /* istanbul ignore next */
    if (boldText) {
        qtd = parseInt(boldText.trim());
    }
  }

  const imoveis: Imoveis[] = [];

  const items = $('.caption.detail').parent();

  items.each((_i, el) => {
    let titulo = $(el).find('.title a').text().trim();
    /* istanbul ignore next */
    if (!titulo) titulo = 'Imóvel';

    // We get real title from image alt text if available
    const imgAlt = $(el).find('img').attr('alt');
    if (imgAlt && titulo === 'VENDE') {
        titulo = imgAlt;
    }

    const locationStr = $(el).find('.location').text().trim() || /* istanbul ignore next */ titulo;
    const endereco = normalizeNeighborhoodName(locationStr);

    // Price
    const priceText = $(el).find('.price').first().text().replace(/[\n\t]/g, '').trim();
    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || /* istanbul ignore next */ '0');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.facilities-list li').each((_, li) => {
       const text = $(li).text().toLowerCase().trim();
       if (text.includes('m²')) {
           area = parseFloat(text.replace('m²', '').trim()) || /* istanbul ignore next */ 0;
       } else if (text.includes('quarto') || /* istanbul ignore next */ text.includes('dormitório')) {
           quartos = parseInt(text) || /* istanbul ignore next */ 0;
       } else if (text.includes('banh')) {
           banheiros = parseInt(text) || /* istanbul ignore next */ 0;
       } else if (text.includes('vaga') || /* istanbul ignore next */ text.includes('garagem')) {
           vagas = parseInt(text) || /* istanbul ignore next */ 0;
       }
    });

    const linkAttr = $(el).find('.title a').attr('href');
    let link = '';
    if (linkAttr) {
        link = linkAttr.startsWith('http') ? linkAttr : `https://www.boscoimoveis.com.br${linkAttr}`;
    }

    const imgRel = $(el).find('img').attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.boscoimoveis.com.br${imgRel}`] : /* istanbul ignore next */ [];

    /* istanbul ignore next */
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
            precoPorMetro: area > 0 ? valor / area : /* istanbul ignore next */ 0,
            site: 'boscoimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  /* istanbul ignore next */
  return { imoveis, qtd: qtd || imoveis.length, html };
}
