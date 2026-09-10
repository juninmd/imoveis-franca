import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.unioconimobiliaria.com.br/imoveis',
  name: 'unioconimobiliaria.com.br',
  driver: 'puppet', // client side rendered listing widget, so puppet driver is better
  itemsPerPage: 18, // Let's guess
  params: [],
  getPaginateParams: (page: number) => {
    if (page === 1) return { url: 'https://www.unioconimobiliaria.com.br/imoveis' };
    return { url: `https://www.unioconimobiliaria.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtdText = $('.ListaImovelTotal').first().text().trim() || $('body').text().match(/(\d+)\s*Im[oó]veis[^\d]*encontrados/i)?.[1];
  const qtd = qtdText ? Number(qtdText) : 0;

  const imoveis: Imoveis[] = [];

  const items = $('.LI_Imovel');

  items.each((_i, el) => {
    const titulo = $(el).find('a.Title').first().text().trim();
    if (!titulo) return;

    // Address
    const endereco = normalizeNeighborhoodName($(el).find('.Endereco .Bairro').first().text().trim() || titulo);

    // Price
    const priceText = $(el).find('.ImovelValor .value').first().text().trim() || '0';
    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    // Details
    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    const areaText = $(el).find('.ResumoItem.AREA_USEFUL .val').first().text().trim() || $(el).find('.ResumoItem.AREA_GROUND .val').first().text().trim();
    if (areaText) area = parseFloat(areaText.replace(/\D/g, '') || '0');

    const quartosText = $(el).find('.ResumoItem.BEDROOM .val').first().text().trim();
    if (quartosText) quartos = parseInt(quartosText || '0');

    const banheirosText = $(el).find('.ResumoItem.BATHROOM .val').first().text().trim();
    if (banheirosText) banheiros = parseInt(banheirosText || '0');

    const vagasText = $(el).find('.ResumoItem.GARAGE .val').first().text().trim();
    if (vagasText) vagas = parseInt(vagasText || '0');

    const linkAttr = $(el).find('a.Title').first().attr('href') || $(el).find('.ImageSide a.Image').first().attr('href');
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://www.unioconimobiliaria.com.br${linkAttr}`) : '';

    const imgRel = $(el).find('img.BannerImage').first().attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.unioconimobiliaria.com.br${imgRel}`] : [];

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
            site: 'unioconimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
