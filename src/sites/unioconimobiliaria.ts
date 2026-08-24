import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.unioconimobiliaria.com.br/buscar?availability=buy&direction=desc&order=most_relevant&search_type=properties_map',
  name: 'unioconimobiliaria.com.br',
  driver: 'puppet', // Imobzi is usually client side rendered (angular or similar), so puppet driver is better
  itemsPerPage: 15, // Let's guess
  params: [],
  getPaginateParams: (page: number) => {
    if (page === 1) return { url: 'https://www.unioconimobiliaria.com.br/buscar?availability=buy&direction=desc&order=most_relevant&search_type=properties_map' };
    return { url: `https://www.unioconimobiliaria.com.br/buscar?availability=buy&direction=desc&order=most_relevant&page=${page}&search_type=properties_map` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtdText = $('body').text().match(/(\d+)\s*Imóveis encontrados/i);
  const qtd = qtdText ? Number(qtdText[1]) : 0;

  const imoveis: Imoveis[] = [];

  const items = $('imobzi-property-card, .property-card, [class*="PropertyCard"]');

  items.each((_i, el) => {
    const titulo = $(el).find('h2, h3').first().text().trim();
    if (!titulo) return;

    // Address
    let endereco = titulo;
    if (titulo.includes(' - ')) {
        const parts = titulo.split(' - ');
        endereco = parts[0].replace(/.* em /i, '').trim();
    } else if (titulo.includes(' no bairro ')) {
        const parts = titulo.split(' no bairro ');
        endereco = parts[parts.length - 1].trim();
    }
    endereco = normalizeNeighborhoodName(endereco);

    // Price
    const priceText = $(el).find('b:contains("R$")').text().trim() || $(el).text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    // Details
    const detailsText = $(el).text();
    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    if (detailsText.match(/(\d+)\s*m²/)) {
        area = parseFloat(detailsText.match(/(\d+)\s*m²/)?.[1] || '0');
    }

    if (detailsText.match(/bed\s*(\d+)/)) {
        quartos = parseInt(detailsText.match(/bed\s*(\d+)/)?.[1] || '0');
    } else if (detailsText.match(/(\d+)\s*quartos/i)) {
        quartos = parseInt(detailsText.match(/(\d+)\s*quartos/i)?.[1] || '0');
    }

    if (detailsText.match(/bathtub\s*(\d+)/)) {
        banheiros = parseInt(detailsText.match(/bathtub\s*(\d+)/)?.[1] || '0');
    }

    if (detailsText.match(/directions_car\s*(\d+)/)) {
        vagas = parseInt(detailsText.match(/directions_car\s*(\d+)/)?.[1] || '0');
    } else if (detailsText.match(/(\d+)\s*vagas/i)) {
        vagas = parseInt(detailsText.match(/(\d+)\s*vagas/i)?.[1] || '0');
    }

    const linkAttr = $(el).find('a').first().attr('href');
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://www.unioconimobiliaria.com.br${linkAttr}`) : '';

    const imgRel = $(el).find('img').attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.unioconimobiliaria.com.br${imgRel}`] : [];

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
            site: 'unioconimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
