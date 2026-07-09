import cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://c15imob.com.br/venda',
  name: 'c15imob.com.br',
  driver: 'puppet',
  itemsPerPage: 20,
  params: [],
  getPaginateParams: (page: number) => {
    if (page === 1) return { url: 'https://c15imob.com.br/venda' };
    return { url: `https://c15imob.com.br/venda?pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const qtd = 0;

  $('.link-card-imovel').each((_i, el) => {
    const parentA = $(el).closest('a.meuLink');
    const link = parentA.attr('href') || '';

    // Titulo
    const titulo = $(el).find('h2.card-title').text().trim() || 'Imóvel em Franca';

    // Address
    const addressText = $(el).find('.container-endereco .card-text').first().text().trim();
    const endereco = normalizeNeighborhoodName(addressText.split('|')[0] || '');

    // Price
    const valorText = $(el).find('.preco-imovel-card strong').text().replace('R$', '').replace(/\./g, '').trim().split(',')[0];
    const valor = parseFloat(valorText || '0');

    // Specs from footer
    let area = 0, areaTotal = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.container-icon').each((_, iconEl) => {
       const text = $(iconEl).text().toLowerCase();
       const valueRaw = $(iconEl).find('.card_imovel_color').text().trim();
       if(text.includes('área') || text.includes('area')) {
           area = parseFloat(valueRaw.replace('m²', '').replace(',', '.').trim()) || 0;
           areaTotal = area;
       } else if (text.includes('quarto') || text.includes('dormit')) {
           quartos = parseInt(valueRaw) || 0;
       } else if (text.includes('vaga')) {
           vagas = parseInt(valueRaw) || 0;
       } else if (text.includes('banheiro')) {
           banheiros = parseInt(valueRaw) || 0;
       }
    });

    const imgRel = $(el).find('.carousel-item img').first().attr('src') || $(el).find('.carousel-item img').first().attr('data-src');
    const imagens = imgRel ? [imgRel] : [];

    if (valor > 0 && link) {
      imoveis.push({
        titulo,
        descricao: '',
        imagens,
        endereco,
        valor,
        area,
        areaTotal,
        quartos,
        banheiros,
        vagas,
        link,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: 'c15imob.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd, html };
}
