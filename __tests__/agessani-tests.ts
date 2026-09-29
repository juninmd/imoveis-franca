import site from '../src/sites/agessani';

describe('agessani', () => {
    it('should parse data correctly', async () => {
        const html = `
        <div class="item-lista">
            <a href="/imovel/123/casa-venda">Link</a>
            <h2>Casa Legal</h2>
            <div class="info-1"></div>
            <div class="info-2">
                <span>3 quartos</span>
                <span>2 vagas</span>
                <span>1 banheiro</span>
            </div>
            <img src="/img.jpg">
            <div>R$ 500.000,00 150m² Ref: 123</div>
        </div>`;
        const result = await site.adapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(500000);
        expect(result.imoveis[0].area).toBe(150);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].banheiros).toBe(1);
        expect(result.imoveis[0].link).toBe('https://www.agessani.com/imovel/123/casa-venda');
    });

    it('should return getPaginateParams', () => {
        expect(site.getPaginateParams(2)).toEqual({ path: '/imovel/?finalidade=venda&pag=2' });
    });
});
