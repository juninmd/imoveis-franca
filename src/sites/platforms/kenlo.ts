import { Imoveis, Site } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../../utils';

const PAGE_SIZE = 12;

type Tipo = 'venda' | 'aluguel';

// Site em Kenlo (SPA): o HTML vem vazio, mas a propria SPA consome /api/listings/<finalidade>.
const buildSite = (host: string, label: string, tipo: Tipo): Site => {
  const route = tipo === 'venda' ? 'a-venda' : 'para-alugar';
  const base = `${host}/api/listings/${route}`;
  const name = `${label} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  return {
    enabled: true,
    tipo,
    url: base,
    name,
    driver: 'axios',
    itemsPerPage: PAGE_SIZE,
    // O teto protege se o catalogo crescer (~920 anuncios = ~77 paginas de JSON leve na Sold).
    maxPages: 100,
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${base}?pagina=${page}` : base }),
    adapter: (payload: unknown) => parseKenlo(payload, host, name),
  } as unknown as Site;
};

/** Par venda/aluguel de um site Kenlo; `host` inclui o esquema (ex.: https://www.soldimob.com.br). */
export const buildKenloSites = (host: string, label: string): Site[] => [buildSite(host, label, 'venda'), buildSite(host, label, 'aluguel')];

interface KenloPhoto { picture_full?: string }
interface KenloListing {
  about_title?: string;
  listing_description?: string;
  city?: string;
  neighborhood_display?: string;
  neighborhood?: string;
  sale_price?: number[];
  rent_price?: number[];
  area?: number[];
  bedrooms?: number[];
  bathrooms?: number[];
  garages?: number[];
  photos?: KenloPhoto[];
  picture_full?: string;
  property_full_reference?: string;
  url?: string;
}

const PROPERTY_TYPES: Record<string, string> = {
  APARTMENT: 'apartamento', HOME: 'casa', HOUSE: 'casa', RESIDENTIAL_HOME: 'casa', LAND: 'terreno', LOT: 'terreno', LOTE: 'terreno',
  FARM: 'rural', SMALL_FARM: 'rural', HALL: 'comercial', STORE: 'comercial', OFFICE: 'comercial', SHED: 'comercial',
};

const first = (range?: number[]): number => (Array.isArray(range) && Number.isFinite(range[0]) ? range[0] : 0);

export async function parseKenlo(payload: unknown, host: string, siteName: string): Promise<{ imoveis: Imoveis[], qtd: number, json: unknown }> {
  const body = (typeof payload === 'string' ? JSON.parse(payload) : payload) as { data?: (KenloListing & { property_type?: string })[], count?: number };
  const imoveis: Imoveis[] = [];

  for (const item of body?.data ?? []) {
    // A API devolve cidades vizinhas (Rifaina, Cristais Paulista...); so Franca interessa.
    if (normalizeText(item.city ?? '') !== 'franca' || !item.url) continue;
    const valor = first(item.sale_price) || first(item.rent_price);
    if (valor <= 0) continue;

    const descricao = (item.listing_description ?? '').replace(/\r/g, '');
    const totalMatch = descricao.match(/Área\s+Total:\s*([\d.,]+)/i);
    const area = first(item.area);
    const areaTotal = totalMatch ? getFixValue(totalMatch[1]) : area;
    const titulo = cleanTitle((item.about_title ?? '').replace(/^Sobre\s+/i, ''));
    const imagens = (item.photos ?? []).map(photo => photo.picture_full).filter((url): url is string => !!url);

    imoveis.push({
      titulo,
      descricao: cleanTitle(descricao),
      imagens: imagens.length > 0 ? imagens : [item.picture_full].filter((url): url is string => !!url),
      endereco: normalizeNeighborhoodName(item.neighborhood_display ?? item.neighborhood ?? ''),
      valor,
      area,
      areaTotal,
      quartos: first(item.bedrooms),
      banheiros: first(item.bathrooms),
      vagas: first(item.garages),
      link: `${host}${item.url}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.property_full_reference,
      tipoImovel: PROPERTY_TYPES[item.property_type ?? ''] ?? (inferTipoImovel(titulo) || undefined),
    });
  }

  return { imoveis, qtd: Number(body?.count) || 0, json: body };
}
