import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://dinizmartins.com.br/imoveis?finalidade=venda',
  name: 'dinizmartins.com.br',
  driver: 'axios',
  itemsPerPage: 12, // Appears to have multiple items, mock 12
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://dinizmartins.com.br/imoveis?finalidade=venda&page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  // Trying to extract quantity, usually there's a pagination or some text. We will mock if not found.
  let qtd = 1000;
  const qtdMatch = html.match(/(\d+)\s+imóveis/i);
  if (qtdMatch) {
      qtd = parseInt(qtdMatch[1]);
  }

  const imoveis: Imoveis[] = [];

  $('.recent-properties-box').each((_i, el) => {
    const linkAttr = $(el).find('a').first().attr('href');
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://dinizmartins.com.br${linkAttr}`) : '';

    // Titulo might just be VENDE, we'll try to extract from link or use a fallback
    let titulo = $(el).find('h1.title').text().trim() || 'IMÓVEL';
    if(linkAttr) {
        const parts = linkAttr.split('/');
        if(parts.length > 2) {
            titulo = parts[parts.length - 2].toUpperCase(); // usually type of property
        }
    }

    const priceText = $(el).find('.price').text().trim();
    let valor = 0;
    if (priceText.toLowerCase().includes('consulte')) {
        valor = 0;
    } else {
        valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
    }

    const bairro = $(el).find('.location').text().trim();
    const endereco = normalizeNeighborhoodName(bairro);

    const imgSrc = $(el).find('img').attr('src');
    const imagens = imgSrc ? [imgSrc] : [];

    let quartos = 0, banheiros = 0, vagas = 0, area = 0;

    $(el).find('.facilities-list li').each((_j, li) => {
        const text = $(li).text().trim().toLowerCase();
        const icon = $(li).find('i').attr('class') || '';

        // Typical structure might use icons or text
        if (icon.includes('bed') || text.includes('quarto') || text.includes('dorm')) {
            quartos = parseInt(text) || 1;
        } else if (icon.includes('bath') || text.includes('banh')) {
            banheiros = parseInt(text) || 1;
        } else if (icon.includes('car') || text.includes('vaga') || text.includes('garag')) {
            vagas = parseInt(text) || 1;
        } else if (text.includes('m²')) {
            area = parseFloat(text.replace('m²', '').trim()) || 0;
        }
    });

    // Use the type from link to refine title
    if(linkAttr) {
       const l = linkAttr.toLowerCase();
       if(l.includes('casa')) titulo = 'CASA';
       if(l.includes('apartamento')) titulo = 'APARTAMENTO';
       if(l.includes('terreno')) titulo = 'TERRENO';
       if(l.includes('chacara') || l.includes('rancho')) titulo = 'CHACARA';
    }

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
            site: 'dinizmartins.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
