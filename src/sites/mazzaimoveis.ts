import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

// Site Next.js (imobiu): a listagem vem no payload RSC (self.__next_f.push) da própria página,
// com ~9 itens por página e paginação via ?pagina=N.
export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.mazzaimoveis.com.br/busca/venda/BR/SP/franca',
  name: 'mazzaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 9,
  params: [],
  getPaginateParams: (page: number) => ({ params: { pagina: page } }),
  adapter,
} as Site;

function extractListing(html: string): { items: any[], total: number } | null {
  const chunks: string[] = [];
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try {
      chunks.push(JSON.parse(`"${m[1]}"`));
    } catch (_e) {
      // chunk inválido, ignora
    }
  }
  const flight = chunks.join('');
  const start = flight.search(/\d+:\{"items":\[/);
  if (start < 0) return null;
  const jsonStart = flight.indexOf('{', start);

  // Percorre o objeto balanceando chaves (respeitando strings) para isolar o JSON.
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = jsonStart; i < flight.length; i++) {
    const c = flight[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    } else if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) { end = i; break; }
  }
  if (end < 0) return null;
  try {
    const data = JSON.parse(flight.slice(jsonStart, end + 1));
    return { items: data.items || [], total: Number(data.total) || 0 };
  } catch (_e) {
    return null;
  }
}

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const listing = extractListing(html);
  const imoveis: Imoveis[] = [];
  if (!listing) return { imoveis, qtd: 0, html };

  for (const item of listing.items) {
    if (item.recordType && item.recordType !== 'property') continue;
    const valor = Number(item.prices?.sale_price) || 0;
    const link = item.absoluteUrl || (item.path ? `https://www.mazzaimoveis.com.br${item.path}` : '');
    if (!link || valor <= 0) continue;

    const bairro = item.address?.neighborhood || '';
    const area = parseFloat(item.built_area || item.usable_area || item.features?.total_area || '0') || 0;
    const areaTotal = parseFloat(item.land_area || item.features?.total_area || '0') || area;
    const imagens: string[] = (item.photos || []).map((p: any) => p?.sources?.[0]).filter(Boolean);

    imoveis.push({
      titulo: String(item.name || item.announcementTitle || '').replace(/\s+/g, ' ').trim(),
      descricao: '',
      imagens,
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal,
      quartos: Number(item.features?.bedrooms) || 0,
      link,
      banheiros: Number(item.features?.bathrooms) || 0,
      vagas: Number(item.features?.garage_spaces) || 0,
      precoPorMetro: areaTotal > 0 ? valor / areaTotal : 0,
      site: 'mazzaimoveis.com.br',
      entrada: valor * 0.20
    });
  }

  return { imoveis, qtd: listing.total, html };
}
