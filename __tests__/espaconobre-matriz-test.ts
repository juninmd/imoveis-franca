import espaconobreimoveis from '../src/sites/espaconobreimoveis';
import matrizimobiliaria from '../src/sites/matriz';

describe('espaconobreimoveis and matriz', () => {
    it('should be configured and enabled', () => {
        expect(espaconobreimoveis).toBeDefined();
        expect(espaconobreimoveis.enabled).toBe(true);
        expect(matrizimobiliaria).toBeDefined();
        expect(matrizimobiliaria.enabled).toBe(true);
    });
});
