import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.casanovaimoveisfranca.com.br/imoveis/finalidade-2-venda',
  name: 'casanovaimoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.casanovaimoveisfranca.com.br/imoveis/finalidade-2-venda/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*Imóveis/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  $('.recent-properties-box').each((_i, el) => {
    const linkAttr = $(el).find('a').first().attr('href');
    if (!linkAttr) return;

    let link = linkAttr;
    if (!link.startsWith('http')) {
      link = `https://www.casanovaimoveisfranca.com.br${link.startsWith('/') ? '' : '/'}${link}`;
    }

    // Filter out rentals after full link resolution just to be safe
    if (link.includes('/aluga/')) return;

    const imgAttr = $(el).find('img').first().attr('src');
    const imagens: string[] = [];
    if (imgAttr) {
        imagens.push(imgAttr.startsWith('http') ? imgAttr : `https://www.casanovaimoveisfranca.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`);
    }

    const priceText = $(el).find('.price').text().replace(/[\n\t]/g, '').trim();
    if (priceText.toLowerCase().includes('consulte-nos')) return;

    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    if (valor <= 0) return;

    const locationText = $(el).find('.location').text().trim();
    const endereco = normalizeNeighborhoodName(locationText);

    let quartos = 0;
    let banheiros = 0;
    let vagas = 0;
    let area = 0;

    $(el).find('.facilities-list li').each((_j, li) => {
        const text = $(li).text().toLowerCase().trim();
        const value = parseInt(text) || 0;

        if (text.includes('quarto') || text.includes('dorm')) {
            quartos = value;
        } else if (text.includes('banheiro') || text.includes('banh')) {
            banheiros = value;
        } else if (text.includes('garagem') || text.includes('vaga')) {
            vagas = value;
        } else if (text.includes('m²') || text.includes('mts') || text.includes('área')) {
             area = getFixValue(text.replace('m²', '').trim());
        }
    });

    // Titulo will be inferred from location and type
    const pathParts = link.split('/');
    const typeIndex = pathParts.indexOf('vende') + 4;
    const type = pathParts[typeIndex] || 'Imóvel';

    const titulo = `${type.charAt(0).toUpperCase() + type.slice(1)} em ${endereco}`;

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
      site: 'casanovaimoveisfranca.com.br',
      entrada: valor * 0.20
    });
  });

  return { imoveis, qtd: qtd || imoveis.length, html };
}
