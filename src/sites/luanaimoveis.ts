import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.luanaimoveis.com.br/imoveis',
  name: 'luanaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 20,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.luanaimoveis.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;

  // Extract JSON data often found in Next.js/Kenlo tags for Luana Imoveis
  const jsonLd = $('script[type="application/ld+json"]').html();
  if (jsonLd) {
    try {
      JSON.parse(jsonLd);
      // Usually an array or an object with @graph
      // Count is rough estimate if not clearly defined
      qtd = 100; // fallback if JSON doesn't say
    } catch(e) {
      /* ignore */
    }
  }

  // Luana Imóveis usually renders some cards in the DOM too, or we can use Kenlo fallback.
  // We'll scrape typical Kenlo dom classes as a fallback.
  $('.property-card, .imovel-card').each((_i, el) => {
    let link = $(el).find('a').first().attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://www.luanaimoveis.com.br${link}`;

    const tag = $(el).find('.tag, .badge').text().toLowerCase();
    if(tag && tag.includes('alug')) return;

    const titulo = $(el).find('.title, h3, h2').text().trim();
    const loc = $(el).find('.location, .bairro').text().trim();
    const bairro = loc.split(',')[0] || 'Franca';
    const endereco = normalizeNeighborhoodName(bairro);

    const valorStr = $(el).find('.price, .valor').text().replace(/R\$/g, '').replace(/\./g, '').trim();
    const valor = getFixValue(valorStr);

    let quartos = 0, banheiros = 0, vagas = 0, area = 0;
    $(el).find('.features li, .amenities span, .infos li').each((_j, feat) => {
        const text = $(feat).text().toLowerCase().trim();
        const numMatch = text.match(/\d+/);
        const num = numMatch ? parseInt(numMatch[0]) : 0;

        if (text.includes('quarto') || text.includes('dorm') || $(feat).find('.icon-bed').length) quartos = num;
        if (text.includes('banheiro') || text.includes('suite') || $(feat).find('.icon-bath').length) banheiros = num;
        if (text.includes('vaga') || text.includes('garagem') || $(feat).find('.icon-car').length) vagas = num;
        if (text.includes('m²') || text.includes('area')) area = num;
    });

    const imagens: string[] = [];
    const imgStr = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
    if (imgStr) {
        imagens.push(imgStr.startsWith('http') ? imgStr : `https://www.luanaimoveis.com.br${imgStr}`);
    }

    if (link && valor > 0) {
      imoveis.push({
        titulo: titulo || `Imóvel em ${endereco}`,
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
        site: 'luanaimoveis.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? (qtd > 0 ? qtd : imoveis.length * 3) : 0, html };
}
