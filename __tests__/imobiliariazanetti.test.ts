import site from '../src/sites/imobiliariazanetti';

describe('imobiliariazanetti', () => {
    it('should be valid', () => {
        expect(site.name).toBe('imobiliariazanetti.com.br');
        expect(site.url).toBe('https://imobiliariazanetti.com.br/comprar/todos');
    });
});
