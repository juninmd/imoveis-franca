import { Imoveis } from '../types';
import { cleanTitle, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://loft.com.br';
const PAGE_SIZE = 38;
const PHOTOS = 'https://content.loft.com.br/homes';

// A Loft e um marketplace: o catalogo de Franca vem de imobiliarias parceiras e corretores. Estas
// ja tem provider proprio, entao seus anuncios (mesmo imovel, outro link) ficariam duplicados.
const COVERED_AGENCIES = ['matriz compra', 'salomao ferreira', 'b&g'];

const HOME_TYPES: Record<string, string> = {
  apartment: 'Apartamento', house: 'Casa', home: 'Casa', agricultural: 'Chácara', land: 'Terreno', lot: 'Terreno',
  commercial: 'Comercial', store: 'Loja', office: 'Sala comercial', shed: 'Barracão', flat: 'Flat', penthouse: 'Cobertura',
};

interface LoftListing {
  id?: string; price?: number; rentalPrice?: number; area?: number; landArea?: string | number; bedrooms?: number; restrooms?: number;
  parkingSpots?: number; photos?: string[]; homeType?: string; description?: string; agencyName?: string | null;
  address?: { neighborhood?: string; city?: string; streetName?: string };
}

const nextData = (html: string): { listings: Array<{ listing?: LoftListing }>, total: number } => {
  const raw = (html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/) || [])[1];
  const queries = raw ? JSON.parse(raw)?.props?.pageProps?.dehydratedState?.queries ?? [] : [];
  const data = queries[0]?.state?.data;
  return { listings: data?.listings ?? [], total: Number(data?.pagination?.totalListings) || 0 };
};

export async function parseLoft(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const aluguel = siteName.endsWith('Alugar');
  const { listings, total } = nextData(html);
  const imoveis: Imoveis[] = [];

  for (const { listing: item } of listings) {
    const valor = Number(aluguel ? item?.rentalPrice : item?.price) || 0;
    if (!item?.id || valor <= 0 || normalizeText(item.address?.city ?? '') !== 'franca') continue;
    if (COVERED_AGENCIES.some(name => normalizeText(item.agencyName ?? '').startsWith(name))) continue;

    const tipoTexto = HOME_TYPES[item.homeType ?? ''] ?? '';
    const bairro = item.address?.neighborhood ?? '';
    const area = Number(item.area) || 0;
    const areaTotal = Number(item.landArea) || area;
    const areaPreco = area || areaTotal;

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto} - ${bairro}`.replace(/^ - | - $/g, '')),
      descricao: cleanTitle(item.description ?? ''),
      imagens: (item.photos ?? []).map(photo => `${PHOTOS}/${item.id}/mobile_${photo}`),
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: areaPreco,
      areaTotal,
      quartos: Number(item.bedrooms) || 0,
      banheiros: Number(item.restrooms) || 0,
      vagas: Number(item.parkingSpots) || 0,
      link: `${host}/imovel/${item.id}?tipoTransacao=${aluguel ? 'aluguel' : 'venda'}`,
      precoPorMetro: areaPreco > 0 ? valor / areaPreco : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: item.id,
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  }

  return { imoveis, qtd: total || imoveis.length, html };
}

export default buildPortalSites({
  host: HOST,
  label: 'loft.com.br',
  pageSize: PAGE_SIZE,
  maxPages: 40,
  driver: 'axios',
  parser: parseLoft,
  firstPageUrl: tipo => `${HOST}/${tipo}/imoveis/sp/franca`,
  pageUrl: (tipo, page) => `${HOST}/${tipo}/imoveis/sp/franca?pagina=${page}`,
});
