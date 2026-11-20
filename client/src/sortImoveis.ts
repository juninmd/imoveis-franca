import type { Imovel } from './types';
import type { SortOrder } from './hooks/useSearchState';

type Key = 'valor' | 'area' | 'precoPorMetro';

const SORTS: Record<SortOrder, { key: Key; dir: 1 | -1 }> = {
  price_asc: { key: 'valor', dir: 1 },
  price_desc: { key: 'valor', dir: -1 },
  area_asc: { key: 'area', dir: 1 },
  area_desc: { key: 'area', dir: -1 },
  price_per_m_asc: { key: 'precoPorMetro', dir: 1 },
  price_per_m_desc: { key: 'precoPorMetro', dir: -1 },
};

const known = (v: number) => Number.isFinite(v) && v > 0;

/** Sites send 0 when area / price per m² is unknown; those go last in both directions instead of
 *  topping an ascending sort as the "smallest" or "cheapest" listing. */
export function sortImoveis(list: readonly Imovel[], order: SortOrder): Imovel[] {
  const { key, dir } = SORTS[order] ?? SORTS.price_asc;
  return [...list].sort((a, b) => {
    const ka = known(a[key]);
    const kb = known(b[key]);
    if (ka !== kb) return ka ? -1 : 1;
    return ka ? (a[key] - b[key]) * dir : 0;
  });
}
