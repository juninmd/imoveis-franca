import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, safeUrl } from '../utils';

const HOST = 'https://www.casamineira.com.br';
const PAGE_SIZE = 30;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const buildSite = (tipo: 'venda' | 'aluguel'): Site => {
  const base = `${HOST}/${tipo}/imovel/franca_sp`;
  const name = `casamineira.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true,
    tipo,
    url: base,
    name,
    driver: 'axios',
    itemsPerPage: PAGE_SIZE,
    // Portal agregador com milhares de anuncios: o teto evita centenas de requisicoes por scraping.
    maxPages: 40,
    axiosConfig: { headers: { 'User-Agent': UA } },
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${base}/pagina-${page}` : base }),
    adapter: (html: string) => adapter(html, name),
  } as unknown as Site;
};

export default [buildSite('venda'), buildSite('aluguel')];

const priceOf = (text: string): number => {
  const match = text.match(/R\$\s*([\d.]+(?:,\d+)?)/);
  return match ? getFixValue(match[1]) : 0;
};

const digits = (text: string): number => parseInt(text.replace(/\D/g, ''), 10) || 0;

// "2 a 3 quartos" ou "120,5 m²": le so o primeiro numero em vez de concatenar os digitos.
const firstNumber = (text: string): number => {
  const match = text.match(/\d+(?:[.,]\d+)?/);
  return match ? Math.round(getFixValue(match[0])) : 0;
};

export async function adapter(html: string, siteName = 'casamineira.com.br'): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  const qtd = digits($('h1').first().text().split(' ')[0]);

  $('[data-qa="POSTING_CARD_PRICE"]').each((_i, priceEl) => {
    // O card so tem classes de CSS modules; sobe ate o ancestral que contem descricao e galeria.
    const card = $(priceEl).parents().filter((_j, p) => $(p).find('[data-qa="POSTING_CARD_DESCRIPTION"]').length === 1
      && $(p).find('[data-qa="POSTING_CARD_GALLERY"]').length === 1).first();
    const href = card.find('[data-qa="POSTING_CARD_DESCRIPTION"] a').attr('href') || '';
    const valor = priceOf($(priceEl).text());
    if (!href || valor <= 0) return;

    const link = safeUrl(href, HOST);
    if (!link) return;
    link.search = '';

    let area = 0; let areaTotal = 0; let quartos = 0; let banheiros = 0; let vagas = 0;
    card.find('[data-qa="POSTING_CARD_FEATURES"] span').each((_j, span) => {
      const text = $(span).text().toLowerCase();
      const n = firstNumber(text);
      if (text.includes('tot')) areaTotal = n;
      else if (text.includes('m²')) area = n;
      else if (text.includes('quarto') || text.includes('dorm')) quartos = n;
      else if (text.includes('banh')) banheiros = n;
      else if (text.includes('vaga')) vagas = n;
    });
    if (area === 0) area = areaTotal;

    const imagens = card.find('[data-qa="POSTING_CARD_GALLERY"] img').map((_j, img) => $(img).attr('src') || '').get().filter(Boolean);
    const alt = cleanTitle(card.find('[data-qa="POSTING_CARD_GALLERY"] img').first().attr('alt') || '');
    const bairro = card.find('[data-qa="POSTING_CARD_LOCATION"]').text().split(',')[0];
    const descricao = cleanTitle(card.find('[data-qa="POSTING_CARD_DESCRIPTION"] a').text());

    imoveis.push({
      titulo: alt || descricao.slice(0, 80),
      descricao,
      imagens,
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: areaTotal || area,
      quartos,
      banheiros,
      vagas,
      link: link.toString(),
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: link.pathname.split('/').pop() || undefined,
      tipoImovel: inferTipoImovel(alt) || undefined,
    });
  });

  return { imoveis, qtd, html };
}
