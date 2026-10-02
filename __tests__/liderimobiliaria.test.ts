import site from '../src/sites/liderimobiliaria';

describe('liderimobiliaria', () => {
    it('should be valid', () => {
        expect(site.name).toBe('liderimobiliaria.com.br');
        expect(site.url).toBe('https://liderimobiliaria.com.br/comprar/todos');
    });
});
