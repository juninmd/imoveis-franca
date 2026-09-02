import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://cidadenovaimoveis.com.br/imoveis/franca/compra',
  name: 'cidadenovaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://cidadenovaimoveis.com.br/imoveis/franca/compra?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const textQtd = $('.header-search h1, .title-search h1, h1.title').text() || $('body').text();
  const qtdMatch = textQtd.match(/(\d+)\s+imóveis/i) || textQtd.match(/(\d+)\s+resultados/i);
  const qtd = qtdMatch ? parseInt(qtdMatch[1]) : 0;

  $('.card, .property-card, article.property, .imovel-card').each((_i, el) => {
    const linkAttr = $(el).find('a').attr('href');
    if (!linkAttr) return;

    let link = linkAttr;
    if (!link.startsWith('http')) {
      link = `https://cidadenovaimoveis.com.br${link.startsWith('/') ? '' : '/'}${link}`;
    }

    const imgAttr = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
    const imagens: string[] = [];
    if (imgAttr) {
        imagens.push(imgAttr.startsWith('http') ? imgAttr : `https://cidadenovaimoveis.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`);
    }

    const priceText = $(el).find('.price, .valor, .property-price').text().replace(/[\n\t]/g, '').trim();
    if (priceText.toLowerCase().includes('consulte')) return;

    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    if (valor <= 0) return;

    const locationText = $(el).find('.location, .address, .bairro, .property-location').text().trim();
    const endereco = normalizeNeighborhoodName(locationText.split(',')[0] || locationText.split('-')[0]);

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.features li, .amenities span, .property-amenities div, .infos li').each((_j, li) => {
        const text = $(li).text().toLowerCase().trim();
        const value = parseInt(text) || 0;

        if (text.includes('quarto') || text.includes('dorm')) {
            quartos = value;
        } else if (text.includes('banheiro') || text.includes('suíte') || text.includes('banh')) {
            banheiros = value;
        } else if (text.includes('vaga') || text.includes('garagem')) {
            vagas = value;
        } else if (text.includes('m²') || text.includes('área')) {
             area = getFixValue(text.replace('m²', '').trim());
        }
    });

    const titulo = $(el).find('.title, h2, h3').first().text().trim() || `Imóvel em ${endereco}`;

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
      site: 'cidadenovaimoveis.com.br',
      entrada: valor * 0.20
    });
  });

  return { imoveis, qtd: qtd || imoveis.length, html };
}
