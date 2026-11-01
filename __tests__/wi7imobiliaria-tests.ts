import site from '../src/sites/wi7imobiliaria';

describe('wi7imobiliaria', () => {
    it('should parse data correctly', async () => {
        const html = `
        <div class="recent-properties-box">
            <div class="title"><a href="/imovel/123/casa-venda">Casa Legal</a></div>
            <div class="location">Franca, SP</div>
            <div class="tag-s">venda</div>
            <ul class="facilities-list">
                <li><span class="flaticon-bed"></span>3</li>
                <li><span class="flaticon-vehicle"></span>2</li>
                <li><span class="flaticon-holidays"></span>1</li>
            </ul>
            <img class="img-responsive" src="/img.jpg">
            <div class="price">R$ 500.000,00</div>
        </div>`;
        const result = await site.adapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(500000);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].banheiros).toBe(1);
        expect(result.imoveis[0].link).toBe('https://www.wi7imobiliaria.com.br/imovel/123/casa-venda');
    });

    it('should return getPaginateParams', () => {
        expect(site.getPaginateParams(2)).toEqual({ url: 'https://www.wi7imobiliaria.com.br/imoveis?page=2' });
    });
});
