import { getQuantizedParams, parseFilters } from '../src/query';

describe('parseFilters', () => {
  it('aceita address como valor único (string) sem quebrar', () => {
    // Antes, `?address=CENTRO` chegava como string e o filtro chamava `.find` nela -> 500.
    expect(parseFilters({ address: 'CENTRO' }).address).toEqual(['CENTRO']);
  });

  it('descarta address em formato inesperado (objeto aninhado)', () => {
    expect(parseFilters({ address: { a: 'x' } }).address).toBeUndefined();
    expect(parseFilters({ address: [] }).address).toBeUndefined();
    expect(parseFilters({ address: ['  ', 'CENTRO ', 42] }).address).toEqual(['CENTRO']);
  });

  it('limita a quantidade e o tamanho dos bairros', () => {
    const address = Array.from({ length: 50 }, (_, i) => `BAIRRO ${i}`);
    expect(parseFilters({ address }).address).toHaveLength(30);
    expect(parseFilters({ address: ['x'.repeat(500)] }).address[0]).toHaveLength(120);
  });

  it('preserva o valor pedido pelo usuário no filtro, sem teto', () => {
    // O teto vale só para a chave de cache. Aplicá-lo aqui tornava a busca MAIS restrita do
    // que o pedido: `?maxAreaTotal=50000` (chácara) virava 10000 e escondia todo lote acima
    // de 1 ha que o master devolvia.
    expect(parseFilters({ maxAreaTotal: 50000 }).maxAreaTotal).toBe(50000);
    expect(parseFilters({ maxArea: 20000 }).maxArea).toBe(20000);
    expect(parseFilters({ maxPrice: 25_000_000 }).maxPrice).toBe(25_000_000);
    expect(parseFilters({ minBedrooms: 999 }).minBedrooms).toBe(999);
  });

  it('ignora números inválidos, negativos e vazios', () => {
    expect(parseFilters({ minPrice: 'abc' }).minPrice).toBeUndefined();
    expect(parseFilters({ minPrice: -10 }).minPrice).toBeUndefined();
    expect(parseFilters({ minPrice: '' }).minPrice).toBeUndefined();
    expect(parseFilters({ minPrice: Infinity }).minPrice).toBeUndefined();
    expect(parseFilters({ minPrice: null }).minPrice).toBeUndefined();
    expect(parseFilters({ minPrice: { $gt: 1 } }).minPrice).toBeUndefined();
    expect(parseFilters({}).minPrice).toBeUndefined();
    expect(parseFilters().minPrice).toBeUndefined();
  });

  it('usa o primeiro valor quando o parâmetro numérico vem repetido', () => {
    expect(parseFilters({ minPrice: ['100', '200'] }).minPrice).toBe(100);
    expect(parseFilters({ minPrice: [] }).minPrice).toBeUndefined();
  });

  it('só aceita tipo dentro da lista permitida', () => {
    expect(parseFilters({ tipo: 'venda' }).tipo).toBe('venda');
    expect(parseFilters({ tipo: ['aluguel'] }).tipo).toBe('aluguel');
    expect(parseFilters({ tipo: 'temporada' }).tipo).toBeUndefined();
  });
});

describe('getQuantizedParams', () => {
  it('quantiza mínimo para baixo e máximo para cima', () => {
    const base = getQuantizedParams(parseFilters({ minPrice: 260000, maxPrice: 310000, minArea: 70, maxArea: 120 }));
    expect(base).toMatchObject({ minPrice: 250000, maxPrice: 350000, minArea: 50, maxArea: 150 });
  });

  it('aplica os defaults quando não há filtro', () => {
    expect(getQuantizedParams(parseFilters({}))).toEqual({
      minPrice: 0, maxPrice: 2000000, quartos: 2, minArea: 0, maxArea: 500, maxPages: undefined,
    });
  });

  it('aplica o teto ao quantizar, limitando o espaço de chaves de cache', () => {
    const base = getQuantizedParams(parseFilters({ minPrice: 1e12, maxPrice: 1e12, minArea: 999999, maxArea: 999999 }));
    expect(base.minPrice).toBe(20_000_000);
    expect(base.maxPrice).toBe(20_000_000);
    expect(base.minArea).toBe(10_000);
    expect(base.maxArea).toBe(10_000);
  });

  it('gera a mesma chave para buscas próximas (cache hit)', () => {
    const a = JSON.stringify(getQuantizedParams(parseFilters({ maxPrice: 300001 })));
    const b = JSON.stringify(getQuantizedParams(parseFilters({ maxPrice: 349999 })));
    expect(a).toBe(b);
  });
});
