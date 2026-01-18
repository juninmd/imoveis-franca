import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://vtiimoveis.com.br/status/venda/?type=casa',
  name: 'vtiimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 10, // Default usually
  params: [],
  getPaginateParams: (page: number) => {
    if (page === 1) return { url: 'https://vtiimoveis.com.br/status/venda/?type=casa' };
    return { url: `https://vtiimoveis.com.br/status/venda/page/${page}/?type=casa` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  // Try to find quantity if available, otherwise just count items or return 0
  // VTI doesn't seem to show total count easily on the listing page
  const qtd = 0;

  const imoveis: Imoveis[] = [];
  $('.item-wrap').each((_i, el) => {
    const titleElement = $(el).find('.item-title a');
    const titulo = titleElement.text().trim();
    const link = titleElement.attr('href') || '';

    // Price
    const valorRaw = $(el).find('.item-price').text().trim();
    const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    // Address
    const addressRaw = $(el).find('.item-address').text().trim();
    // Sometimes address is in the title or hidden.
    // Title format: "CASA À VENDA – BAIRRO SÃO JOAQUIM"
    let endereco = normalizeNeighborhoodName(addressRaw);
    if (!endereco && titulo.includes(' – ')) {
        const parts = titulo.split(' – ');
        if (parts.length > 1) {
            endereco = normalizeNeighborhoodName(parts[1]);
        }
    }

    // Details
    const areaRaw = $(el).find('.h-area .hz-figure').first().text().trim();
    const area = getFixValue(areaRaw);

    const quartosRaw = $(el).find('.h-beds .hz-figure').text().trim();
    const quartos = Number(quartosRaw) || 0;

    const banheirosRaw = $(el).find('.h-baths .hz-figure').text().trim();
    const banheiros = Number(banheirosRaw) || 0;

    const vagasRaw = $(el).find('.h-cars .hz-figure').text().trim();
    const vagas = Number(vagasRaw) || 0;

    // Image
    const imgRel = $(el).find('.listing-thumb img').attr('src');
    const imagens = imgRel ? [imgRel] : [];

    if (link && valor > 0) {
        imoveis.push({
            titulo,
            descricao: '',
            imagens,
            endereco,
            valor,
            area,
            areaTotal: area, // Often Total Area isn't distinguished on card
            quartos,
            link,
            banheiros,
            vagas,
            precoPorMetro: area > 0 ? valor / area : 0,
            site: 'vtiimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
