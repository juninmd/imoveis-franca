import espaconobreimoveis from '../src/sites/espaconobreimoveis';
import matriz from '../src/sites/matriz';

describe('espaconobreimoveis and matriz', () => {
    it('should be configured and enabled', () => {
        expect(espaconobreimoveis).toBeDefined();
        expect(espaconobreimoveis.enabled).toBe(true);
        expect(matriz).toHaveLength(2);
        expect(matriz.every(s => s.enabled)).toBe(true);
    });
});
