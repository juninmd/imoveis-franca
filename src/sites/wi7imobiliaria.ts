import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

const site: Site = {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.wi7imobiliaria.com.br/imoveis/a-venda/franca',
  name: 'wi7imobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => {
    return { path: `pagina-${page}` };
  },
  adapter,
};

export default site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;

  const items = $('.recent-properties-box');
  qtd = items.length;

  items.each((_, el) => {
    const parent = $(el);
    const title = parent.find('.title a').text().trim() || parent.find('.location a').text().trim() || 'Imóvel';

    const link = parent.find('a').first().attr('href') || '';

    const image = parent.find('img').attr('src') || '';
    const location = parent.find('.location a').text().replace(/\s+/g, ' ').trim();
    const endereco = normalizeNeighborhoodName(location);

    const priceText = parent.find('.price').text().trim();
    const valor = getFixValue(priceText);

    if (valor === 0 || !link) return;

    let quartos = 0;
    let banheiros = 0;
    let vagas = 0;

    parent.find('.facilities-list li').each((_, li) => {
        const text = $(li).text().toLowerCase();
        if (text.includes('quarto')) {
            const m = text.match(/(\d+)/);
            if (m) quartos = parseInt(m[1], 10);
        } else if (text.includes('banheiro')) {
            const m = text.match(/(\d+)/);
            if (m) banheiros = parseInt(m[1], 10);
        } else if (text.includes('garagem') || text.includes('vaga')) {
            const m = text.match(/(\d+)/);
            if (m) vagas = parseInt(m[1], 10);
        }
    });

    imoveis.push({
      titulo: title,
      descricao: '',
      imagens: [image].filter(Boolean),
      endereco,
      valor,
      area: 0,
      areaTotal: 0,
      quartos,
      banheiros,
      vagas,
      link,
      precoPorMetro: 0,
      site: 'wi7imobiliaria.com.br',
      entrada: valor * 0.20
    });
  });

  return { imoveis, qtd, html };
}
