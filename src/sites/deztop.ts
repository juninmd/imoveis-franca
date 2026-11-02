import * as cheerio from 'cheerio';
import { Imoveis } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://deztop.com';
const PAGE_SIZE = 30;
const base = (tipo: string) => `${HOST}/br/imoveis/sp/franca/${tipo === 'venda' ? 'venda' : 'aluguel'}`;

// Cada busca serve ate a pagina 96 (a 97 volta a primeira); a venda tem ~8.900 anuncios, entao e
// fatiada em faixas de preco que cabem no teto (maior faixa: ~2.060 anuncios, 69 paginas).
export const DEZTOP_SALE_BANDS = [
  { pricemax: 100000 },
  { pricemin: 100000, pricemax: 200000 },
  { pricemin: 200000, pricemax: 300000 },
  { pricemin: 300000, pricemax: 450000 },
  { pricemin: 450000, pricemax: 700000 },
  { pricemin: 700000, pricemax: 1200000 },
  { pricemin: 1200000 },
];

// Classificado com anuncios de corretores e proprietarios. Preco "R$1" e placeholder de "sob consulta".
export async function parseDeztop(html: string, siteName: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  const total = parseInt(($('body').text().match(/([\d.]+)\s+im[oó]veis/i) || [])[1]?.replace(/\./g, '') ?? '0', 10);

  $('article').each((_i, el) => {
    const card = $(el);
    const link = card.find('h3 a').first().attr('href') || '';
    // O primeiro <article> da pagina envolve a lista inteira.
    if (!link || card.find('article').length) return;
    const valor = getFixValue(card.find('p.fs-5').first().text().replace(/[^\d.,]/g, ''));
    const [bairroTexto, cidadeTexto = ''] = cleanTitle(card.find('address').text()).split(/,\s*(?=[^,]*$)/);
    if (valor < 100 || normalizeText(cidadeTexto.replace(/\s*-\s*[a-z]{2}\s*$/i, '')) !== 'franca') return;

    const badges = card.find('.badge.text-bg-light').map((_j, b) => $(b).text()).get();
    const metric = (label: RegExp): number => {
      const found = badges.find(b => label.test(b));
      return found ? getFixValue(found.replace(/[^\d.,]/g, '')) : 0;
    };
    const titulo = cleanTitle(card.find('h3').first().text());
    const tipoTexto = cleanTitle(card.find('.visually-hidden li').first().text());
    const area = metric(/m²/);

    imoveis.push({
      titulo,
      descricao: cleanTitle(card.find('p.crop-text-3').text()),
      imagens: [...new Set(card.find('picture img').map((_j, img) => $(img).attr('src') || '').get().filter(Boolean))],
      endereco: normalizeNeighborhoodName(bairroTexto),
      valor,
      area,
      areaTotal: area,
      quartos: metric(/Dormit/),
      banheiros: metric(/Banheiro/),
      vagas: metric(/Vaga/),
      link,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: (link.match(/\/imovel\/(\d+)/) || [])[1],
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  });

  return { imoveis, qtd: total || imoveis.length, html };
}

export default buildPortalSites({
  host: HOST,
  label: 'deztop.com',
  pageSize: PAGE_SIZE,
  maxPages: 96,
  driver: 'axios',
  parser: parseDeztop,
  firstPageUrl: base,
  pageUrl: (tipo, page) => `${base(tipo)}?page=${page}`,
  bands: tipo => (tipo === 'venda' ? DEZTOP_SALE_BANDS : undefined),
});
