import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://cidadenovaimoveis.com.br/imoveis/franca/compra',
  name: 'cidadenovaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 36,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://cidadenovaimoveis.com.br/imoveis/franca/compra?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const textQtd = $('h3').filter((_i, el) => /im[óo]veis encontrados/i.test($(el).text())).first().text();
  const qtdMatch = textQtd.match(/(\d+)\s+im[óo]veis/i);
  const qtd = qtdMatch ? parseInt(qtdMatch[1]) : 0;

  // Cada card e um <a id="property-card-N"> que envolve div.property-card
  $('a[id^="property-card"]').each((_i, el) => {
    const linkAttr = $(el).attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://cidadenovaimoveis.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    const priceText = $(el).find('h3').text().replace(/\s+/g, ' ').trim();
    if (!/\d/.test(priceText)) return; // "A consultar"
    const valor = parseFloat(priceText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    if (valor <= 0) return;

    const imgAttr = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
    const imagens: string[] = [];
    if (imgAttr) {
      imagens.push(imgAttr.startsWith('http') ? imgAttr : `https://cidadenovaimoveis.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`);
    }

    const locationText = $(el).find('p.small').first().text().trim();
    const endereco = normalizeNeighborhoodName(locationText.split(',')[0] || 'Franca');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('span[data-tooltip]').each((_j, span) => {
      const tip = ($(span).attr('data-tooltip') || '').toLowerCase();
      const txt = $(span).text().trim();
      if (tip.includes('área') || tip.includes('area')) area = parseFloat((txt.match(/[\d.]+/) || ['0'])[0]) || 0;
      else if (tip.includes('quarto')) quartos = parseInt(txt) || 0;
      else if (tip.includes('banheiro')) banheiros = parseInt(txt) || 0;
      else if (tip.includes('vaga')) vagas = parseInt(txt) || 0;
    });

    const titulo = $(el).find('h2').first().text().trim() || `Imóvel em ${endereco}`;

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
      site: 'cidadenovaimoveis.com.br',
      entrada: valor * 0.20
    });
  });

  return { imoveis, qtd: qtd || imoveis.length, html };
}
