import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

// O site e uma SPA: a listagem vem de GET /api/public/properties (JSON puro, page_size max 48).
const PAGE_SIZE = 48;
const BASE = 'https://espaconobreimoveis.com.br';

export default {
  driver: 'axios_rest',
  enabled: true,
  tipo: 'venda',
  name: 'espaconobreimoveis.com.br',
  url: `${BASE}/api/public/properties`,
  method: 'GET',
  params: [{ purpose: 'sale', city: 'Franca', sort: 'recent', page_size: PAGE_SIZE, page: 1 }],
  itemsPerPage: PAGE_SIZE,
  getPaginateParams: (page: number) => ({ params: { page } }),
  adapter,
} as Site;

export async function adapter(json: any): Promise<{ imoveis: Imoveis[], qtd: number, json: any }> {
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
      descricao: '',
      imagens,
      endereco: normalizeNeighborhoodName(item.neighborhood || ''),
      valor,
      area,
      areaTotal,
      quartos: Number(item.bedrooms) || 0,
      link: `${BASE}/imoveis/${item.slug}`,
      banheiros: Number(item.bathrooms) || 0,
      vagas: Number(item.parking_spots) || 0,
      precoPorMetro: areaTotal > 0 ? valor / areaTotal : 0,
      site: 'espaconobreimoveis.com.br',
      entrada: valor * 0.20,
    });
  }
  return { imoveis, qtd, json };
}
