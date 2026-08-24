import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.iegimoveisfrancaeregiao.com.br/imovel/venda',
  name: 'iegimoveisfrancaeregiao.com.br',
  driver: 'axios',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.iegimoveisfrancaeregiao.com.br/imovel/venda?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const items = $('.imovelcard');

  items.each((_i, el) => {
    const $el = $(el);
    const linkAttr = $el.attr('data-link');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.iegimoveisfrancaeregiao.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    let titulo = $el.find('h2.imovelcard__info__tag').first().text().trim() || $el.find('.imovelcard__info__ref').text().trim().replace('Ref:', '').trim();
    if(!titulo) titulo = "Imóvel à Venda";

    let endereco = "";
    const enderecoElem = $el.find('.imovelcard__info__local').first().text().trim();
    if (enderecoElem) {
        endereco = enderecoElem.replace(', Franca / SP', '').replace('Franca / SP', '').trim();
    }
    endereco = normalizeNeighborhoodName(endereco);

    // Only fetch franca
    if(enderecoElem && !enderecoElem.includes('Franca')) return;

    const valorText = $el.find('.imovelcard__valor__valor').text().trim() || '0';
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    const features = $el.find('.imovelcard__info__feature');
    features.each((_idx, feature) => {
        const text = $(feature).text().trim().toLowerCase();
        if(text.includes('m²') || text.includes('m2')) {
            area = parseFloat(text.replace('m²', '').replace('m2', '').trim());
        }
        if($(feature).find('.fa-bed').length > 0) {
            quartos = parseInt(text.replace(/[^\d]/g, '')) || 0;
        }
        if($(feature).find('.fa-bath').length > 0 || $(feature).find('.fa-shower').length > 0) {
            banheiros = parseInt(text.replace(/[^\d]/g, '')) || 0;
        }
        if($(feature).find('.fa-car').length > 0) {
            vagas = parseInt(text.replace(/[^\d]/g, '')) || 0;
        }
    });

    const imgAttr = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.iegimoveisfrancaeregiao.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`] : [];

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
            site: 'iegimoveisfrancaeregiao.com.br',
            entrada: valor * 0.2
        });
    }
  });

  const qtd = imoveis.length;

  return { imoveis, qtd, html };
}
