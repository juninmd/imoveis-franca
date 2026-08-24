import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.salimimobiliaria.com.br/venda/sao-paulo/franca/',
  name: 'salimimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 12, // the site returns 12 per page by default
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.salimimobiliaria.com.br/venda/sao-paulo/franca/?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const numText = $('.resultados .num').first().text().trim();
  const bodyText = $('body').text();
  const qtdMatch = numText ? [null, numText] : (bodyText.match(/(\d+)\s*imóveis\s*encontrados/i) || bodyText.match(/(\d+)\s*resultados/i));
  let qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  $('li.col-im-grid').each((_i, el) => {
    const $el = $(el);
    const linkEl = $el.find('a.main').first();
    const linkAttr = linkEl.attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.salimimobiliaria.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    const titulo = (linkEl.attr('title') || '').trim();
    if (!titulo) return;

    const endereco = normalizeNeighborhoodName($el.find('.bairro').first().text().trim());

    const precoText = ($el.find('.valor.por').first().text() || $el.find('.preco').first().text()).replace(/\s+/g, ' ').trim();
    const valorMatch = precoText.match(/R\$\s*([\d.,]+)/);
    const valor = valorMatch ? parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

    const area = getFixValue($el.find('.area-total em').first().text().trim());
    const quartos = parseInt($el.find('.dorms em').first().text()) || 0;
    const banheiros = parseInt($el.find('.bwcs em').first().text()) || 0;
    const vagas = parseInt($el.find('.vagas em').first().text()) || 0;

    const imgAttr = $el.find('figure img').first().attr('data-src') || $el.find('figure img').first().attr('src');
    const imagens = imgAttr ? [imgAttr.startsWith('//') ? `https:${imgAttr}` : (imgAttr.startsWith('http') ? imgAttr : `https://www.salimimobiliaria.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`)] : [];

    if (valor > 0 && link && !imoveis.find(i => i.link === link)) {
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
            site: 'salimimobiliaria.com.br',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}
