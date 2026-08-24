import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://anzimoveis.com.br/busca?finalidade=venda',
  name: 'anzimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 20, // guess
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://anzimoveis.com.br/busca?finalidade=venda&pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtdText = $('.total-properties').text().replace(/[^0-9]/g, '');
  const qtd = parseInt(qtdText) || 0;
  const imoveis: Imoveis[] = [];

  $('.property-card, a.card, .property, .card-imovel, .imovel-box, [class*="imovel"]').each((_i, el) => {
    const isAnchor = $(el).is('a');
    let linkAttr = '';
    if (isAnchor) {
        linkAttr = $(el).attr('href') || '';
    } else {
        linkAttr = $(el).find('a').first().attr('href') || '';
    }

    const link = linkAttr.startsWith('http') ? linkAttr : `https://anzimoveis.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    const titulo = $(el).find('.title, h2, h3').first().text().trim();
    if (!titulo) return;

    const addressText = $(el).find('.address, .location, [class*="address"], [class*="location"]').first().text().trim();
    const endereco = normalizeNeighborhoodName(addressText.split(',')[0]);

    let valor = 0;
    const priceText = $(el).find('.price, [class*="price"], .valor').first().text().trim();
    if (priceText.includes('R$')) {
       const raw = priceText.split('R$')[1].replace(/\./g, '').replace(',', '.').trim();
       valor = parseFloat(raw) || 0;
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.features span, .amenities span, [class*="feature"] span, [class*="info"] span').each((_, infoEl) => {
       const text = $(infoEl).text().toLowerCase();

       if (text.includes('quarto') || text.includes('dormit')) {
           quartos = parseInt(text.replace(/[^0-9]/g, '')) || 0;
       } else if (text.includes('banheiro') || text.includes('suíte') || text.includes('suite')) {
           banheiros = parseInt(text.replace(/[^0-9]/g, '')) || 0;
       } else if (text.includes('vaga')) {
           vagas = parseInt(text.replace(/[^0-9]/g, '')) || 0;
       } else if (text.includes('m²')) {
           area = getFixValue(text.replace('m²', '').trim());
       }
    });

    const imagens: string[] = [];
    $(el).find('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && !src.includes('logo') && !src.includes('icon')) {
            imagens.push(src.startsWith('http') ? src : `https://anzimoveis.com.br${src.startsWith('/') ? '' : '/'}${src}`);
        }
    });

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
            site: 'anzimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  // if the generic extraction grabbed nothing, this scraper is just a placeholder to be refined by manual testing
  return { imoveis, qtd, html };
}
