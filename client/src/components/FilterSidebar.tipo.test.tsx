/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterSidebar } from './FilterSidebar';
import { buildSearch, emptyFilters, parseSearch } from '../hooks/useSearchState';

const setup = (overrides = {}) => {
  let filters: any = { ...emptyFilters(), ...overrides };
  const setFilters = vi.fn((updater: any) => {
    filters = typeof updater === 'function' ? updater(filters) : updater;
  });
  render(<FilterSidebar availableSites={[]} filters={filters} setFilters={setFilters as any} addresses={[]} />);
  return { setFilters, current: () => filters };
};

describe('FilterSidebar: tipo de imóvel e palavra-chave', () => {
  it('alterna o tipo de imóvel selecionado', () => {
    const { current } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'casa' }));
    expect(current().tipoImovel).toEqual(['casa']);
    fireEvent.click(screen.getByRole('button', { name: 'terreno' }));
    expect(current().tipoImovel).toEqual(['casa', 'terreno']);
  });

  it('desmarca um tipo já selecionado e reflete aria-pressed', () => {
    const { current } = setup({ tipoImovel: ['casa'] });
    expect(screen.getByRole('button', { name: 'casa' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'rural' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'casa' }));
    expect(current().tipoImovel).toEqual([]);
  });

  it('digitar na busca atualiza q', () => {
    const { current } = setup();
    fireEvent.change(screen.getByLabelText('Buscar por palavra-chave'), { target: { value: 'piscina' } });
    expect(current().q).toBe('piscina');
  });

  it('Limpar da seção zera tipo e palavra-chave', () => {
    const { current } = setup({ tipoImovel: ['casa'], q: 'piscina' });
    fireEvent.click(screen.getAllByRole('button', { name: 'Limpar' })[0]);
    expect(current().tipoImovel).toEqual([]);
    expect(current().q).toBe('');
  });

  it('funciona com filtros antigos sem os campos novos', () => {
    const { current } = setup({ tipoImovel: undefined, q: undefined });
    fireEvent.click(screen.getByRole('button', { name: 'comercial' }));
    expect(current().tipoImovel).toEqual(['comercial']);
  });
});

describe('useSearchState: tipoImovel e q na URL', () => {
  it('ida e volta preserva tipo e palavra-chave', () => {
    const state = parseSearch('?tipoImovel=casa&tipoImovel=terreno&q=piscina');
    expect(state.filters.tipoImovel).toEqual(['casa', 'terreno']);
    expect(state.filters.q).toBe('piscina');
    expect(parseSearch(`?${buildSearch(state)}`).filters).toMatchObject({ tipoImovel: ['casa', 'terreno'], q: 'piscina' });
  });

  it('descarta tipos fora da lista e limita q a 100 caracteres', () => {
    const state = parseSearch(`?tipoImovel=<script>&tipoImovel=casa&q=${'x'.repeat(300)}`);
    expect(state.filters.tipoImovel).toEqual(['casa']);
    expect(state.filters.q).toHaveLength(100);
  });

  it('sem os parâmetros, devolve vazios e não escreve nada na URL', () => {
    const state = parseSearch('');
    expect(state.filters).toMatchObject({ tipoImovel: [], q: '' });
    expect(buildSearch(state)).toBe('');
  });
});
