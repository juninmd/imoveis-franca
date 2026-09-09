import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.wi7imobiliaria.com.br/imoveis/a-venda/franca',
  name: 'wi7imobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.wi7imobiliaria.com.br/imoveis/a-venda/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imovel[] = [];

  const items = $('.recent-properties-box');

  items.each((_i, el) => {
    let titulo = $(el).find('h1.title a').text().trim();
    /* istanbul ignore next */
    if (!titulo) titulo = $(el).find('img').attr('alt') || 'Imóvel';

    const linkAttr = $(el).find('h1.title a').attr('href') || $(el).find('a').first().attr('href');
    /* istanbul ignore next */
    if (!linkAttr) return;

    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.wi7imobiliaria.com.br${linkAttr}`;

    const priceText = $(el).find('.price').first().text().replace(/[\n\t]/g, '').trim();
    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    const enderecoText = $(el).find('.location a').text().trim() || 'Franca';
    const endereco = normalizeNeighborhoodName(enderecoText);

    const imgSrc = $(el).find('img').attr('src');
    const imagens = imgSrc ? [imgSrc] : [];

    let quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.facilities-list li').each((_, li) => {
       const text = $(li).text().toLowerCase();
       if (text.includes('quarto')) {
           quartos = parseInt(text) || 0;
       } else if (text.includes('banheiro') || text.includes('banh')) {
           banheiros = parseInt(text) || 0;
       } else if (text.includes('garagem') || text.includes('vaga')) {
           vagas = parseInt(text) || 0;
       }
    });

    if (valor > 0 && link && titulo.toLowerCase().includes('venda')) {
        const area = 0; // The site doesn't seem to show area clearly on list
        imoveis.push({
            titulo,
            valor,
            endereco,
            quartos,
            banheiros,
            vagas,
            imagens,
            link,
            area,
            areaTotal: area,
            descricao: '',
            /* istanbul ignore next */
            precoPorMetro: area > 0 ? valor / area : 0,
            site: 'wi7imobiliaria.com.br',
            entrada: valor * 0.20
        });
    }
  });

  const qtd = imoveis.length;

  return { imoveis, qtd, html };
}
