import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';

const HOST = 'https://www.chavesnamao.com.br';
const PAGE_SIZE = 15;
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const buildSite = (tipo: 'venda' | 'aluguel'): Site => {
  const base = `${HOST}/${tipo === 'venda' ? 'imoveis-a-venda' : 'imoveis-para-alugar'}/sp-franca/`;
  const name = `chavesnamao.com.br - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true,
    tipo,
    url: base,
    name,
    driver: 'axios',
    itemsPerPage: PAGE_SIZE,
    // Milhares de anuncios, 15 por pagina; a partir da pagina 100 o site devolve 403.
    maxPages: 99,
    axiosConfig: { headers: { 'User-Agent': UA } },
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${base}?pg=${page}` : base }),
    adapter: (html: string) => adapter(html, name),
  } as unknown as Site;
};

export default [buildSite('venda'), buildSite('aluguel')];

const firstNumber = (text: unknown): number => {
  const match = String(text ?? '').match(/\d[\d.]*(?:,\d+)?/);
  return match ? getFixValue(match[0]) : 0;
};

/** Os anuncios vem em JSON-LD (schema.org), mais estavel do que as classes CSS do portal. */
const readListing = ($: ReturnType<typeof cheerio.load>): any => {
  let listing: any;
  $('script[type="application/ld+json"]').each((_i, script) => {
    try {
      const json = JSON.parse($(script).contents().text());
      if (json && json['@type'] === 'RealEstateListing') listing = json;
    } catch {
      // bloco JSON-LD de terceiros que nao e JSON valido: ignora e segue
    }
  });
  return listing;
};

export async function adapter(html: string, siteName = 'chavesnamao.com.br'): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const offers = readListing($)?.offers;
  const items: any[] = Array.isArray(offers?.itemListElement) ? offers.itemListElement : [];
  const imoveis: Imoveis[] = [];

  for (const offer of items) {
    const item = offer.itemOffered || {};
    const address = item.address || {};
    const valor = firstNumber(offer.price);
    const link = String(offer.url || '');
    // Busca por cidade devolve vizinhas; so Franca interessa.
    if (!link.startsWith(HOST) || valor <= 0 || !normalizeText(address.addressRegion || '').startsWith('franca')) continue;

    const titulo = cleanTitle(offer.name || '');
    const area = firstNumber(item.floorSize?.unitText);
    const anunciante = offer.offeredBy?.name;

    imoveis.push({
      titulo,
      descricao: [titulo, address.streetAddress, anunciante ? `Anunciante: ${anunciante}` : ''].filter(Boolean).join(' · '),
      imagens: item.image ? [String(item.image)] : [],
      endereco: normalizeNeighborhoodName(address.addressLocality || ''),
      valor,
      area,
      areaTotal: area,
      quartos: Number(item.numberOfBedrooms) || 0,
      banheiros: Number(item.numberOfBathroomsTotal) || 0,
      vagas: 0,
      link,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: link.match(/id-(\d+)/)?.[1],
      tipoImovel: inferTipoImovel(titulo) || undefined,
    });
  }

  return { imoveis, qtd: Number(readListing($)?.offers?.numberOfItems) || 0, html };
}
