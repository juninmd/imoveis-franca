import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.artefattoimoveis.com.br/imoveis/a-venda',
  name: 'artefattoimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.artefattoimoveis.com.br/imoveis/a-venda?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtd = 0;
  const imoveis: Imoveis[] = [];

  $('.imovel-box').each((_i, el) => {
    const linkEl = $(el).find('a').first();
    const linkAttr = linkEl.attr('href') || '';
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.artefattoimoveis.com.br${linkAttr}`;

    const titulo = $(el).find('h2.tit-list, .tit-list').first().text().trim();
    if (!titulo) return;

    let endereco = '';
    let locationText = $(el).find('.fa-map-marker-alt').parent().text().trim();
    if (locationText) {
       if (locationText.includes(titulo)) locationText = locationText.replace(titulo, '').trim();
       endereco = normalizeNeighborhoodName(locationText.split(',')[0]);
    }

    let valor = 0;
    const priceText = $(el).find('.price-area .fw-700').text().trim() || $(el).find('.price-area').text().trim();
    if (priceText.includes('R$')) {
       const raw = priceText.split('R$')[1].replace(/\./g, '').replace(',', '.').trim();
       valor = parseFloat(raw) || 0;
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.infos .p-t-15 span').each((_, infoEl) => {
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
    $(el).find('figure img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src) {
            let fixedSrc = src;
            if (src.includes('thumb.php?img=')) {
               fixedSrc = src.split('img=')[1].split('&')[0];
            }
            imagens.push(fixedSrc.startsWith('http') ? fixedSrc : `https://www.artefattoimoveis.com.br${fixedSrc.startsWith('/') ? '' : '/'}${fixedSrc}`);
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
            site: 'artefattoimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
