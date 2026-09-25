import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/imoveis',
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.fortscunha.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;
  const paginations = $('.pagination a').map((_i, el) => {
    const p = parseInt($(el).text());
    return isNaN(p) ? 0 : p;
  }).get();
  if (paginations.length > 0) {
    qtd = Math.max(...paginations) * 12;
  } else {
    qtd = 50;
  }

  $('.recent-properties-box, .property-box').each((_i, el) => {
    let link = $(el).find('a').first().attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://www.fortscunha.com.br${link}`;

    const tag = $(el).find('.tag-s, .tag-f, .badge').text().toLowerCase();
    if(tag && !tag.includes('vend')) return;

    const titulo = $(el).find('.title a, h3 a').text().trim();
    const loc = $(el).find('.location, .address').text().trim();
    const bairro = loc.split(',')[0] || 'Franca';
    const endereco = normalizeNeighborhoodName(bairro);

    const valorStr = $(el).find('.price').text().replace(/R\$/g, '').replace(/\./g, '').trim();
    const valor = getFixValue(valorStr);

    let quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.facilities-list li, .features li').each((_j, feat) => {
        const text = $(feat).text().toLowerCase().trim();
        const numMatch = text.match(/\d+/);
        const num = numMatch ? parseInt(numMatch[0]) : 0;
        if($(feat).find('.flaticon-bed, .icon-bed').length > 0) quartos = num;
        if($(feat).find('.flaticon-holidays, .icon-bath').length > 0) banheiros = num;
        if($(feat).find('.flaticon-vehicle, .icon-garage').length > 0) vagas = num;
    });

    const imagens: string[] = [];
    const imgStr = $(el).find('.img-responsive, img').attr('src') || $(el).find('img').attr('data-src');
    if (imgStr) {
        imagens.push(imgStr.startsWith('http') ? imgStr : `https://www.fortscunha.com.br${imgStr}`);
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
        site: 'fortscunha.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? qtd : 0, html };
}
