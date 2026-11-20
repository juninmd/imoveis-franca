import { describe, expect, it } from 'vitest';
import { sortImoveis } from './sortImoveis';
import type { Imovel } from './types';

const imovel = (link: string, valor: number, area: number, precoPorMetro: number) =>
  ({ link, valor, area, precoPorMetro }) as Imovel;

const list = [
  imovel('sem-area', 300_000, 0, 0),
  imovel('grande', 900_000, 300, 3_000),
  imovel('pequeno', 200_000, 50, 4_000),
];
const order = (o: Parameters<typeof sortImoveis>[1]) => sortImoveis(list, o).map((i) => i.link);

describe('sortImoveis', () => {
  it('keeps listings without area last when sorting by smallest area', () => {
    expect(order('area_asc')).toEqual(['pequeno', 'grande', 'sem-area']);
  });

  it('keeps listings without price per m² last when sorting by cheapest m²', () => {
    expect(order('price_per_m_asc')).toEqual(['grande', 'pequeno', 'sem-area']);
  });

  it('descending sorts also keep unknown values last', () => {
    expect(order('area_desc')).toEqual(['grande', 'pequeno', 'sem-area']);
    expect(order('price_per_m_desc')).toEqual(['pequeno', 'grande', 'sem-area']);
  });

  it('sorts by price and does not mutate the input', () => {
    expect(order('price_asc')).toEqual(['pequeno', 'sem-area', 'grande']);
    expect(order('price_desc')).toEqual(['grande', 'sem-area', 'pequeno']);
    expect(list[0].link).toBe('sem-area');
  });
});
