import { Imoveis, Site } from '../../types';
import { normalizeNeighborhoodName } from '../../utils';

// Projetive: SPA multi-tenant; a listagem e GET /api/public/properties (JSON, page_size max 48).
// Alguns tenants exigem o cabecalho x-tenant-host (identificador do site, nao e segredo).
const PAGE_SIZE = 48;
const SORTS = ['recent', 'featured'];

export interface ProjetiveConfig { base: string; name: string; tenantHost?: string; }

export function parseProjetive(json: any, name: string, base: string): { imoveis: Imoveis[], qtd: number, json: any } {
  const qtd = Number(json?.total) || 0;
  const imoveis: Imoveis[] = [];

  for (const item of json?.items || []) {
    if (item.is_active === false || item.purpose === 'rent') continue;
    const valor = Number(item.machine?.price) || 0;
    if (valor <= 0 || !item.slug) continue;

    const area = Number(item.built_area || item.useful_area || item.total_area || 0);
    const areaTotal = Number(item.land_area || item.total_area || 0) || area;
    const imagens: string[] = (item.images || [])
      .filter((i: any) => i.kind === 'photo' || !i.kind)
      .map((i: any) => i.medium_url || i.url)
      .filter(Boolean);
    if (imagens.length === 0 && item.machine?.image_url) imagens.push(item.machine.image_url);

    imoveis.push({
      titulo: (item.type?.name || item.property_type || 'IMÓVEL').toUpperCase(),
      descricao: String(item.short_description || item.machine?.description || ''),
      imagens,
      endereco: normalizeNeighborhoodName(item.neighborhood || ''),
      valor,
      area,
      areaTotal,
      quartos: Number(item.bedrooms) || 0,
      link: `${base}/imoveis/${item.slug}`,
      banheiros: Number(item.bathrooms) || 0,
      vagas: Number(item.parking_spots) || 0,
      precoPorMetro: areaTotal > 0 ? valor / areaTotal : 0,
      site: name,
      entrada: valor * 0.20,
      codigo: item.reference_code ? String(item.reference_code) : undefined,
    });
  }
  return { imoveis, qtd, json };
}

/** Site de venda de um tenant Projetive; `city` restringe a Franca porque o catalogo pode cobrir a regiao. */
export const buildProjetiveSite = ({ base, name, tenantHost }: ProjetiveConfig): Site => ({
  driver: 'axios_rest',
  enabled: true,
  tipo: 'venda',
  name,
  url: `${base}/api/public/properties`,
  method: 'GET',
  ...(tenantHost ? { axiosConfig: { headers: { 'x-tenant-host': tenantHost, Accept: 'application/json' } } } : {}),
  // A listagem pagina por offset com empates: uma ordem sozinha repete anuncios e perde outros, entao
  // duas ordens sao varridas e o dedupe por link une (juntas cobrem o catalogo todo: 1.800 distintos).
  params: SORTS.map(sort => ({ sort })),
  itemsPerPage: PAGE_SIZE,
  getPaginateParams: (page: number, variant?: { sort: string }) => ({
    url: `${base}/api/public/properties?${new URLSearchParams({ purpose: 'sale', city: 'Franca', sort: variant?.sort ?? SORTS[0], page_size: String(PAGE_SIZE), page: String(page) })}`,
  }),
  adapter: (json: any) => parseProjetive(json, name, base),
} as unknown as Site);
