import { useCallback, useEffect, useState } from 'react';

export interface Filters {
  tipo: 'venda' | 'aluguel';
  minPrice: string;
  maxPrice: string;
  minBedrooms: string;
  minBathrooms: string;
  minVacancies: string;
  minArea: string;
  maxArea: string;
  minAreaTotal: string;
  maxAreaTotal: string;
  address: string[];
}

export type SortOrder = 'price_asc' | 'price_desc' | 'area_desc' | 'price_per_m_asc';
export type ViewMode = 'grid' | 'list';

export const NUMERIC_FILTER_KEYS = [
  'minPrice', 'maxPrice', 'minBedrooms', 'minBathrooms', 'minVacancies',
  'minArea', 'maxArea', 'minAreaTotal', 'maxAreaTotal',
] as const;

const SORT_ORDERS: SortOrder[] = ['price_asc', 'price_desc', 'area_desc', 'price_per_m_asc'];

export const emptyFilters = (tipo: 'venda' | 'aluguel' = 'venda'): Filters => ({
  tipo,
  minPrice: '', maxPrice: '', minBedrooms: '', minBathrooms: '', minVacancies: '',
  minArea: '', maxArea: '', minAreaTotal: '', maxAreaTotal: '', address: [],
});

export interface SearchState {
  filters: Filters;
  sortOrder: SortOrder;
  viewMode: ViewMode;
  showFavoritesOnly: boolean;
}

export const parseSearch = (search: string): SearchState => {
  const params = new URLSearchParams(search);
  const filters = emptyFilters(params.get('tipo') === 'aluguel' ? 'aluguel' : 'venda');

  for (const key of NUMERIC_FILTER_KEYS) {
    const value = params.get(key);
    // Só dígitos: um `?minPrice=<script>` na URL compartilhada não pode virar estado do app.
    if (value && /^\d{1,9}$/.test(value)) {
      filters[key] = value;
    }
  }
  filters.address = params.getAll('address').filter(Boolean).slice(0, 30);

  const sort = params.get('sort') as SortOrder;
  return {
    filters,
    sortOrder: SORT_ORDERS.includes(sort) ? sort : 'price_asc',
    viewMode: params.get('view') === 'list' ? 'list' : 'grid',
    showFavoritesOnly: params.get('favoritos') === '1',
  };
};

const OWNED_KEYS = new Set<string>([...NUMERIC_FILTER_KEYS, 'tipo', 'address', 'sort', 'view', 'favoritos']);

export const buildSearch = (state: SearchState, currentSearch = ''): string => {
  const params = new URLSearchParams();
  // Preserva o que nao e nosso (utm_*, gclid, parametros de campanha): reescrever a URL no
  // mount descartava esses valores antes mesmo de o usuario interagir.
  new URLSearchParams(currentSearch).forEach((value, key) => {
    if (!OWNED_KEYS.has(key)) params.append(key, value);
  });
  if (state.filters.tipo === 'aluguel') params.set('tipo', 'aluguel');
  for (const key of NUMERIC_FILTER_KEYS) {
    if (state.filters[key]) params.set(key, state.filters[key]);
  }
  state.filters.address.forEach(address => params.append('address', address));
  if (state.sortOrder !== 'price_asc') params.set('sort', state.sortOrder);
  if (state.viewMode !== 'grid') params.set('view', state.viewMode);
  if (state.showFavoritesOnly) params.set('favoritos', '1');
  return params.toString();
};

/**
 * Mantém a busca na URL: o usuário consegue compartilhar, favoritar no navegador e recarregar
 * sem perder o que filtrou. Usa replaceState para não encher o histórico a cada tecla, e
 * escuta popstate para acompanhar navegação do usuário.
 */
export const useSearchState = () => {
  const [state, setState] = useState<SearchState>(() => parseSearch(window.location.search));

  useEffect(() => {
    const search = buildSearch(state, window.location.search);
    const base = search ? `?${search}` : window.location.pathname;
    window.history.replaceState(null, '', `${base}${window.location.hash}`);
  }, [state]);

  useEffect(() => {
    const onPopState = () => setState(parseSearch(window.location.search));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setFilters = useCallback((update: Filters | ((prev: Filters) => Filters)) => {
    setState(prev => ({
      ...prev,
      filters: typeof update === 'function' ? update(prev.filters) : update,
    }));
  }, []);

  const setSortOrder = useCallback((sortOrder: SortOrder) => setState(prev => ({ ...prev, sortOrder })), []);
  const setViewMode = useCallback((viewMode: ViewMode) => setState(prev => ({ ...prev, viewMode })), []);
  const setShowFavoritesOnly = useCallback(
    (update: boolean | ((prev: boolean) => boolean)) => setState(prev => ({
      ...prev,
      showFavoritesOnly: typeof update === 'function' ? update(prev.showFavoritesOnly) : update,
    })),
    [],
  );

  return { ...state, setFilters, setSortOrder, setViewMode, setShowFavoritesOnly };
};
