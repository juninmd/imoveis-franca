import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { buildSearch, parseSearch, useSearchState } from './useSearchState';

describe('parseSearch', () => {
  it('lê a busca inteira da URL', () => {
    const state = parseSearch('?tipo=aluguel&minPrice=1200&maxPrice=2500&address=CENTRO&address=JARDIM&sort=area_desc&view=list&favoritos=1');

    expect(state.filters.tipo).toBe('aluguel');
    expect(state.filters.minPrice).toBe('1200');
    expect(state.filters.address).toEqual(['CENTRO', 'JARDIM']);
    expect(state.sortOrder).toBe('area_desc');
    expect(state.viewMode).toBe('list');
    expect(state.showFavoritesOnly).toBe(true);
  });

  it('cai nos padrões quando a URL está vazia', () => {
    const state = parseSearch('');
    expect(state).toMatchObject({ sortOrder: 'price_asc', viewMode: 'grid', showFavoritesOnly: false });
    expect(state.filters.tipo).toBe('venda');
    expect(state.filters.address).toEqual([]);
  });

  it('descarta valores forjados na URL compartilhada', () => {
    const state = parseSearch('?tipo=temporada&minPrice=<script>&sort=hackeado&view=matrix');
    expect(state.filters.tipo).toBe('venda');
    expect(state.filters.minPrice).toBe('');
    expect(state.sortOrder).toBe('price_asc');
    expect(state.viewMode).toBe('grid');
  });
});

describe('buildSearch', () => {
  it('omite os padrões para deixar a URL curta', () => {
    expect(buildSearch(parseSearch(''))).toBe('');
  });

  it('faz round-trip do estado', () => {
    const original = '?tipo=aluguel&minPrice=1200&address=CENTRO&sort=area_desc&view=list&favoritos=1';
    const state = parseSearch(original);
    expect(parseSearch(`?${buildSearch(state)}`)).toEqual(state);
  });
});

describe('useSearchState', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('inicia a partir da URL atual', () => {
    window.history.replaceState(null, '', '/?tipo=aluguel&minBedrooms=3');
    const { result } = renderHook(() => useSearchState());
    expect(result.current.filters.tipo).toBe('aluguel');
    expect(result.current.filters.minBedrooms).toBe('3');
  });

  it('escreve o filtro na URL para a busca ficar compartilhável', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => result.current.setFilters(prev => ({ ...prev, maxPrice: '350000' })));

    expect(window.location.search).toContain('maxPrice=350000');
  });

  it('não empilha uma entrada de histórico por tecla digitada', () => {
    const { result } = renderHook(() => useSearchState());
    const before = window.history.length;

    act(() => result.current.setFilters(prev => ({ ...prev, maxPrice: '3' })));
    act(() => result.current.setFilters(prev => ({ ...prev, maxPrice: '35' })));

    expect(window.history.length).toBe(before);
  });

  it('preserva parâmetros de campanha que não são nossos', () => {
    // Reescrever a URL no mount descartava utm_*/gclid antes de o usuário interagir.
    window.history.replaceState(null, '', '/?utm_source=instagram&tipo=aluguel');
    const { result } = renderHook(() => useSearchState());

    act(() => result.current.setFilters(prev => ({ ...prev, minBedrooms: '2' })));

    const params = new URLSearchParams(window.location.search);
    expect(params.get('utm_source')).toBe('instagram');
    expect(params.get('minBedrooms')).toBe('2');
    expect(params.get('tipo')).toBe('aluguel');
  });

  it('não duplica os próprios parâmetros a cada escrita', () => {
    window.history.replaceState(null, '', '/?tipo=aluguel&address=CENTRO');
    const { result } = renderHook(() => useSearchState());

    act(() => result.current.setFilters(prev => ({ ...prev, maxPrice: '2000' })));
    act(() => result.current.setFilters(prev => ({ ...prev, maxPrice: '3000' })));

    const params = new URLSearchParams(window.location.search);
    expect(params.getAll('tipo')).toEqual(['aluguel']);
    expect(params.getAll('address')).toEqual(['CENTRO']);
    expect(params.getAll('maxPrice')).toEqual(['3000']);
  });

  it('acompanha a navegação do usuário (voltar/avançar)', () => {
    const { result } = renderHook(() => useSearchState());

    act(() => {
      window.history.replaceState(null, '', '/?view=list');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(result.current.viewMode).toBe('list');
  });
});
