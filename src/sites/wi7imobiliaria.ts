import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.wi7imobiliaria.com.br/imoveis/a-venda/franca',
  name: 'wi7imobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.wi7imobiliaria.com.br/imoveis/a-venda/franca/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;
  const paginationLinks = $('.pagination a');
  let lastPage = 1;
  paginationLinks.each((_, el) => {
    const href = $(el).attr('href');
    if (href) {
        const m = href.match(/pagina-(\d+)/);
        if (m) {
            const p = parseInt(m[1], 10);
            if (!isNaN(p) && p > lastPage) lastPage = p;
        }
    }
  });

  const items = $('.thumbnail.recent-properties-box');
  if (items.length > 0) {
      qtd = lastPage * items.length;
  }

  items.each((_, el) => {
    const linkEl = $(el).find('h1.title a');
    let link = linkEl.attr('href') || '';
    if (link && !link.startsWith('http')) {
        link = `https://www.wi7imobiliaria.com.br${link}`;
    }
    const titulo = linkEl.text().trim() || 'Imóvel';

    const priceStr = $(el).find('.price').text().trim();
    const valor = getFixValue(priceStr);

    let endereco = $(el).find('.location').text().trim();
    endereco = normalizeNeighborhoodName(endereco);

    let image = $(el).find('img').attr('src') || '';
    if (image && !image.startsWith('http')) {
        image = `https://www.wi7imobiliaria.com.br${image}`;
    }

    const listText = $(el).find('.facilities-list').text();
    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    let m = listText.match(/(\d+)\s*Quarto/i);
    if(m) quartos = parseInt(m[1], 10);
    m = listText.match(/(\d+)\s*Banheiro/i);
    if(m) banheiros = parseInt(m[1], 10);
    m = listText.match(/(\d+)\s*Garagem/i);
    if(m) vagas = parseInt(m[1], 10);
    m = listText.match(/(\d+)\s*m/i);
    if(m) area = parseInt(m[1], 10);

    if (link && !link.includes('undefined')) {
      imoveis.push({
        titulo,
        descricao: '',
        imagens: image ? [image] : [],
        endereco,
        valor,
        area,
        areaTotal: area,
        quartos,
        banheiros,
        vagas,
        link,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: 'wi7imobiliaria.com.br',
        entrada: valor * 0.2
      });
    }
  });

  return { imoveis, qtd, html };
}
