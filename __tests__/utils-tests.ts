import { getFixValue, normalizeNeighborhoodName } from '../src/utils';

describe('Utils', () => {
  describe('getFixValue', () => {
    it('should parse simple integers', () => {
      expect(getFixValue('100')).toBe(100);
    });

    it('should parse decimals with comma', () => {
      expect(getFixValue('100,50')).toBe(100.5);
    });

    it('should handle thousands separator (dots) if suffix > 2 digits', () => {
      expect(getFixValue('1.000')).toBe(1000);
    });

    it('should handle decimal with dots if suffix <= 2 digits', () => {
      // Logic in code: if (l > 2) remove dots, else replace dot with comma
      expect(getFixValue('10.50')).toBe(10.5);
      expect(getFixValue('10.5')).toBe(10.5);
    });

    it('should return 0 for non-numeric strings', () => {
      expect(getFixValue('abc')).toBe(0);
    });

    it('should handle mixed format', () => {
      expect(getFixValue('1.200,50')).toBe(1200.5);
    });

    it('should handle empty string', () => {
        expect(getFixValue('')).toBe(0);
    });
  });

  describe('normalizeNeighborhoodName', () => {
    it('should normalize basic names', () => {
      expect(normalizeNeighborhoodName('Centro')).toBe('CENTRO');
    });

    it('should remove accents', () => {
      expect(normalizeNeighborhoodName('Jardim América')).toBe('JARDIM AMERICA');
    });

    it('should replace PQ with PARQUE', () => {
      expect(normalizeNeighborhoodName('PQ. DO HORTO')).toBe('PARQUE DO HORTO');
    });

    it('should remove extra spaces', () => {
        expect(normalizeNeighborhoodName('  Bairro   Legal  ')).toBe('BAIRRO LEGAL');
    });
  });
});
