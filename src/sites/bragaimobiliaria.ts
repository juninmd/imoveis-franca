import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { getFixValue, normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.bragaimobiliaria.com.br/imoveis/finalidade-2-comprar/cidade-FRANCA-franca/pagina-1',
  name: 'bragaimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.bragaimobiliaria.com.br/imoveis/finalidade-2-comprar/cidade-FRANCA-franca/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imoveis[] = [];

  $('.recent-properties-box').each((_i, el) => {
    const linkAttr = $(el).find('h3.location a').attr('href');
    if (!linkAttr) return;
    const link = linkAttr;

    let tituloRaw = $(el).find('span.tag-f a').first().text().trim();
    if (!tituloRaw) tituloRaw = $(el).find('.tag-f').text().trim();

    const enderecoRaw = $(el).find('h3.location a').text().trim();
    const endereco = normalizeNeighborhoodName(enderecoRaw.split(',')[0].trim());

    // Remove "Consulte-nos", "R$", extra spaces, dots and replace comma with dot
    // If it has a slash (e.g., 160.000,00 / 700,00), take the first part
    const priceText = $(el).find('.price').text().trim().split('/')[0].replace('Consulte-nos', '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valor = parseFloat(priceText || '0');

    if (valor <= 0) return;

    const imagens: string[] = [];
    $(el).find('img').each((_i, img) => {
       let src = $(img).attr('src');
       if (!src) return;
       if (src.includes('logo')) return;
       if (!src.startsWith('http')) {
           src = `https://www.bragaimobiliaria.com.br/${src}`;
       }
       imagens.push(src);
    });

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.facilities-list li').each((_i, fac) => {
        const text = $(fac).text().toLowerCase().trim();
        const value = parseInt(text) || 0;

        if (text.includes('quarto')) {
            quartos = value;
        } else if (text.includes('banheiro')) {
            banheiros = value;
        } else if (text.includes('garagem') || text.includes('vaga')) {
            vagas = value;
        } else if (text.includes('m²')) {
            area = getFixValue(text.replace('m²', '').trim());
        }
    });

    if (valor > 0) {
        imoveis.push({
            titulo: tituloRaw,
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
            site: 'bragaimobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd: imoveis.length, html };
}
