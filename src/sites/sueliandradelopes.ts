import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.sueliandradelopes.com.br/imovel/?finalidade=venda',
  name: 'sueliandradelopes.com.br',
  driver: 'axios',
  itemsPerPage: 15, // A API tem paginação, vou verificar a URL depois
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.sueliandradelopes.com.br/imovel/?finalidade=venda&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imoveis[] = [];

  $('.imovelcard').each((_i, el) => {
    const linkAttr = $(el).find('a.imovelcard__img').attr('href');
    if (!linkAttr) return;
    const link = `https://www.sueliandradelopes.com.br${linkAttr}`;

    const tituloRaw = $(el).find('.imovelcard__info__ref').text().trim();

    const enderecoRaw = $(el).find('.imovelcard__info__local').text().trim();
    const endereco = normalizeNeighborhoodName(enderecoRaw.split(',')[0].trim());

    const priceText = $(el).find('.imovelcard__valor__valor').text()
      .trim()
      .replace('R$', '')
      .replace(/\./g, '')
      .replace(',', '.')
      .trim();
    const valor = parseFloat(priceText || '0');

    if (valor <= 0) return;

    const imagens: string[] = [];
    $(el).find('img').each((_i, img) => {
      let src = $(img).attr('data-src') || $(img).attr('src');
      if (!src) return;
      if (src.includes('logo')) return;
      src = src.replace('thumb15-', '');
      if (!src.startsWith('http') && !src.startsWith('data:image')) {
        src = `https://www.sueliandradelopes.com.br${src}`;
      }
      imagens.push(src);
    });

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.imovelcard__info__feature').each((_i, fac) => {
      const text = $(fac).text().toLowerCase().trim();
      const value = parseInt(text) || 0;

      if (text.includes('dormitório') || text.includes('quarto')) {
        quartos = value;
      } else if (text.includes('banheiro')) {
        banheiros = value;
      } else if (text.includes('vaga')) {
        vagas = value;
      } else if (text.includes('m²')) {
        area = getFixValue(text.replace('m²', '').trim());
      }
    });

    if (valor > 0) {
      imoveis.push({
        titulo: tituloRaw,
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
        site: 'sueliandradelopes.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length, html };
}
