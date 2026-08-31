import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.neoka.com.br/imoveis',
  name: 'neoka.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.neoka.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;

  // They don't seem to show a direct count in a predictable way on all fastimob platforms, default to high number
  qtd = 50;

  $('.recent-properties-box').each((_i, el) => {
    let link = $(el).find('a').first().attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://www.neoka.com.br${link}`;

    // Only capture 'venda' properties if 'tipo' is venda, but they use tag-s/tag-f
    const tag = $(el).find('.tag-s').text().toLowerCase() || $(el).find('.tag-f').text().toLowerCase();
    if(tag && !tag.includes('vend')) return;

    const titulo = $(el).find('.title a').text().trim();

    const loc = $(el).find('.location').text().trim();
    const bairro = loc.split(',')[0] || 'Franca';

    const endereco = normalizeNeighborhoodName(bairro);

    let valorStr = $(el).find('.price').text().replace(/R\$/g, '').replace(/\./g, '').trim();
    const valor = getFixValue(valorStr);

    let quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.facilities-list li').each((_j, feat) => {
        const text = $(feat).text().toLowerCase().trim();
        const numMatch = text.match(/\d+/);
        const num = numMatch ? parseInt(numMatch[0]) : 0;

        if($(feat).find('.flaticon-bed').length > 0) quartos = num;
        if($(feat).find('.flaticon-holidays').length > 0) banheiros = num;
        if($(feat).find('.flaticon-vehicle').length > 0) vagas = num;
    });

    const imagens: string[] = [];
    const imgStr = $(el).find('.img-responsive').attr('src');
    if (imgStr) {
        imagens.push(imgStr.startsWith('http') ? imgStr : `https://www.neoka.com.br${imgStr}`);
    }

    if (link && valor > 0) {
      imoveis.push({
        titulo: titulo || `Imóvel em ${endereco}`,
        descricao: '',
        imagens,
        endereco,
        valor,
        area: 0,
        areaTotal: 0,
        quartos,
        link,
        banheiros,
        vagas,
        precoPorMetro: 0,
        site: 'neoka.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? qtd : 0, html };
}
