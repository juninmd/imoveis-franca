import site from '../src/sites/wi7imobiliaria';

describe('wi7imobiliaria', () => {
    it('should parse data correctly', async () => {
        const html = `
        <div class="col-lg-4 col-md-4 col-sm-6">
            <h3>Casa em Franca</h3>
            <a href="/imovel/321">Link</a>
            <div class="price">R$ 300.000,00</div>
            <ul>
                <li>3 quartos</li>
                <li>2 vagas</li>
                <li>1 banheiro</li>
                <li>100 m²</li>
            </ul>
            <img src="/img2.jpg">
        </div>`;
        const result = await site.adapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(300000);
        expect(result.imoveis[0].area).toBe(100);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].banheiros).toBe(1);
        expect(result.imoveis[0].link).toBe('https://www.wi7imobiliaria.com.br/imovel/321');
    });

    it('should return getPaginateParams', () => {
        expect(site.getPaginateParams(2)).toEqual({ path: '/imoveis/a-venda/pagina/2' });
    });
});
