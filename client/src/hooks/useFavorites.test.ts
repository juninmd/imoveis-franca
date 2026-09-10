import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFavorites } from './useFavorites';
import type { Imovel } from '../types';

const imovel = (over: Partial<Imovel> = {}): Imovel => ({
  site: 'exemplo.com.br', titulo: 'Casa', descricao: '', imagens: [], endereco: 'CENTRO',
  valor: 350000, area: 90, areaTotal: 180, quartos: 3, link: 'https://exemplo/1',
  banheiros: 2, vagas: 1, precoPorMetro: 1944, entrada: 70000,
  valorMedioBairroPorAreaTotal: 0, tipo: 'venda', ...over,
});

describe('useFavorites', () => {
  beforeEach(() => localStorage.clear());

  it('guarda o anúncio inteiro, não só o link', () => {
    // É isso que permite listar os favoritos sem depender do resultado da busca atual.
    const { result } = renderHook(() => useFavorites());

    act(() => { result.current.toggle(imovel()); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].titulo).toBe('Casa');
    expect(result.current.isFavorite('https://exemplo/1')).toBe(true);
  });

  it('mantém um aluguel favoritado visível depois de trocar para venda', () => {
    // Antes a lista de favoritos era filtrada do resultado da busca: mudar de finalidade
    // esvaziava a tela enquanto o contador seguia mostrando o total salvo.
    const { result } = renderHook(() => useFavorites());

    act(() => { result.current.toggle(imovel({ link: 'https://exemplo/aluguel', tipo: 'aluguel' })); });
    act(() => { result.current.sync([imovel({ link: 'https://exemplo/venda' })]); });

    expect(result.current.items.map(i => i.link)).toEqual(['https://exemplo/aluguel']);
    expect(result.current.count).toBe(1);
  });

  it('remove ao alternar de novo e informa a direção', () => {
    const { result } = renderHook(() => useFavorites());

    let added: boolean | undefined;
    act(() => { added = result.current.toggle(imovel()); });
    expect(added).toBe(true);

    act(() => { added = result.current.toggle(imovel()); });
    expect(added).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it('persiste entre montagens', () => {
    const first = renderHook(() => useFavorites());
    act(() => { first.result.current.toggle(imovel()); });
    first.unmount();

    const second = renderHook(() => useFavorites());
    expect(second.result.current.isFavorite('https://exemplo/1')).toBe(true);
  });

  it('migra favoritos antigos (lista de links) e os completa quando reaparecem', () => {
    localStorage.setItem('favorites', JSON.stringify(['https://exemplo/1']));
    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite('https://exemplo/1')).toBe(true);
    expect(result.current.items).toHaveLength(0);

    act(() => { result.current.sync([imovel()]); });
    expect(result.current.items).toHaveLength(1);
  });

  it('sobrevive a um storage corrompido', () => {
    localStorage.setItem('favorites:v2', '{nao é json');
    const { result } = renderHook(() => useFavorites());
    expect(result.current.count).toBe(0);
  });
});
