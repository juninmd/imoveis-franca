import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

const HOST = 'https://imobiliariafabioliporoni.com.br';
const SITE_NAME = 'imobiliariafabioliporoni.com.br';

export default {
  enabled: true,
  tipo: 'venda',
  url: `${HOST}/comprar/sp/franca/`,
  name: SITE_NAME,
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => ({ url: `${HOST}/comprar/sp/franca/${page > 1 ? `pagina-${page}/` : ''}` }),
  adapter,
} as Site;

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  // A paginacao so mostra uma janela de paginas; o maior numero visivel e o piso do total.
  const pages = $('a[href*="paginacao("]')
    .map((_i, a) => parseInt($(a).text().replace(/\D/g, ''), 10) || 0)
    .get();
  const qtd = pages.length > 0 ? Math.max(...pages) * 12 : $('.resultado').length;

  $('.resultado').each((_i, el) => {
    const card = $(el);
    const link = card.closest('a').attr('href') || '';
    const valor = toNumber(card.find('.valor h5').text());
    if (!link || valor <= 0) return;

    const titulo = cleanTitle(card.find('.tipo').text());
    const bairro = card.find('.localizacao span').text().split(' - ')[0];

    let quartos = 0; let banheiros = 0; let vagas = 0; let area = 0; let areaTotal = 0;
    card.find('.detalhe').each((_j, det) => {
      const text = $(det).text().toLowerCase();
      const spans = $(det).find('span').map((_k, s) => $(s).text().trim()).get();
      if (text.includes('dormit')) quartos = toNumber(spans[0]);
      else if (text.includes('banheiro')) banheiros = toNumber(spans[0]);
      else if (text.includes('vaga')) vagas = toNumber(spans[0]);
      else if (text.includes('m²')) {
        // "250.00 m² total 250.00 m² útil": cada numero vem seguido do seu rotulo
        spans.forEach((value, idx) => {
          const label = (spans[idx + 1] || '').toLowerCase();
          if (!/^[\d.,]+$/.test(value)) return;
          if (label.includes('total') || label.includes('terreno')) areaTotal = Math.max(areaTotal, toNumber(value));
          else if (label.includes('útil') || label.includes('constru')) area = Math.max(area, toNumber(value));
        });
      }
    });
    if (area === 0) area = areaTotal;

    const imagem = card.find('img').first().attr('src');
    imoveis.push({
      titulo,
      descricao: cleanTitle(card.find('.descricao').text()),
      imagens: imagem ? [imagem] : [],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: areaTotal || area,
      quartos,
      banheiros,
      vagas,
      link: link.startsWith('http') ? link : `${HOST}${link}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: SITE_NAME,
      entrada: valor * 0.20,
      codigo: card.find('.referencia span').text().trim() || undefined,
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  });

  return { imoveis, qtd, html };
}
