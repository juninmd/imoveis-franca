import { inferTipoImovel, normalizeText, safeUrl } from '../src/utils';

describe('safeUrl', () => {
  it('resolve relativo e devolve null para href invalido em vez de lancar', () => {
    expect(safeUrl('/a/b', 'https://x.com')?.toString()).toBe('https://x.com/a/b');
    expect(safeUrl('http://', 'https://x.com')).toBeNull();
  });
});
import { parseFilters } from '../src/query';

describe('normalizeText', () => {
  it('remove acentos, caixa e espacos repetidos', () => {
    expect(normalizeText('  Ótima  CHÁCARA ')).toBe('otima chacara');
  });
  it('aceita vazio e ausente', () => {
    expect(normalizeText('')).toBe('');
    expect(normalizeText()).toBe('');
  });
});

describe('inferTipoImovel', () => {
  it.each([
    ['Apartamento para comprar com 54 m²', 'apartamento'],
    ['Cobertura duplex no Centro', 'apartamento'],
    ['Casa - Jardim Paulistano', 'casa'],
    ['Sobrado em condomínio', 'casa'],
    ['Terreno · 490m²', 'terreno'],
    ['Lote/Terreno para comprar', 'terreno'],
    ['Chácara com casa de 3 quartos', 'rural'],
    ['Sala comercial no Centro', 'comercial'],
    ['Galpão industrial', 'comercial'],
    ['Imóvel qualquer', ''],
  ])('%s -> %s', (title, expected) => {
    expect(inferTipoImovel(title)).toBe(expected);
  });

  it('aceita ausente', () => {
    expect(inferTipoImovel()).toBe('');
  });
});

describe('parseFilters: tipoImovel e q', () => {
  it('normaliza tipoImovel (unico ou lista) para minusculas', () => {
    expect(parseFilters({ tipoImovel: 'Casa' }).tipoImovel).toEqual(['casa']);
    expect(parseFilters({ tipoImovel: ['Casa', 'TERRENO'] }).tipoImovel).toEqual(['casa', 'terreno']);
    expect(parseFilters({}).tipoImovel).toBeUndefined();
  });

  it('q: aparado, limitado a 100 caracteres e so aceita texto', () => {
    expect(parseFilters({ q: '  jardim  ' }).q).toBe('jardim');
    expect(parseFilters({ q: ['primeiro', 'segundo'] }).q).toBe('primeiro');
    expect(parseFilters({ q: 'x'.repeat(300) }).q).toHaveLength(100);
    expect(parseFilters({ q: '   ' }).q).toBeUndefined();
    expect(parseFilters({ q: { a: 1 } }).q).toBeUndefined();
    expect(parseFilters({}).q).toBeUndefined();
  });
});
