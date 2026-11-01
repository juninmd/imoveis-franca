import francaempreendimentos, { adapter } from '../src/sites/francaempreendimentos';

describe('francaempreendimentos', () => {
    it('should have correct site configuration', () => {
        expect(francaempreendimentos.enabled).toBe(true);
        expect(francaempreendimentos.name).toBe('francaempreendimentos.com.br');
    });

    it('should adapt correctly', async () => {
        const result = await adapter('<html><a data-testid="linkElement" href="https://www.francaempreendimentos.com.br/imovel/123">Link</a></html>');
        expect(result.qtd).toBe(0);
        expect(result.imoveis.length).toBe(1);
    });
});
