import { getFixValue, normalizeNeighborhoodName } from '../src/utils';

describe('Utils Extra Tests', () => {
  it('normalizeNeighborhoodName handles special cases', () => {
    expect(normalizeNeighborhoodName('Vila PQ. das Flores')).toBe('VILA PARQUE DAS FLORES');
    expect(normalizeNeighborhoodName('Jd. Aeroporto')).toBe('JD AEROPORTO');
    expect(normalizeNeighborhoodName('Vila  São   João')).toBe('VILA SAO JOAO');
    expect(normalizeNeighborhoodName('Açude')).toBe('ACUDE');
  });

  it('getFixValue returns 0 for non-numeric strings', () => {
    expect(getFixValue('abc')).toBe(0);
    expect(getFixValue('..')).toBe(0);
    expect(getFixValue(undefined)).toBe(0);
    expect(getFixValue('')).toBe(0); // standardized || '0'

    // Branch coverage for dot handling
    expect(getFixValue('1.000,00')).toBe(1000); // l > 2 (000,00 is 6 chars)
    expect(getFixValue('1.50')).toBe(1.5); // l <= 2 (50 is 2 chars)
    expect(getFixValue('1.5')).toBe(1.5); // l <= 2 (5 is 1 char)

    // Trim coverage
    expect(getFixValue(' 1.50 ')).toBe(1.5);

    // Trailing dot
    expect(getFixValue('100.')).toBe(100);
  });
});
