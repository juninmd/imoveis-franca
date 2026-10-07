import site from '../src/sites/imobiliariazanetti';

describe('imobiliariazanetti', () => {
    it('is disabled (Peruibe agency, no Franca listings)', () => {
        expect(site.name).toBe('imobiliariazanetti.com.br');
        expect(site.enabled).toBe(false);
    });
});
