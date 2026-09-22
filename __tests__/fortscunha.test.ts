import site, { adapter } from '../src/sites/fortscunha';

describe('fortscunha site', () => {
    it('should match fastimob adapter signature and exported object', async () => {
        expect(site.enabled).toBe(true);
        expect(site.name).toBe('fortscunha.com.br');
        expect(site.driver).toBe('axios');
        expect(site.url).toBe('https://www.fortscunha.com.br/imoveis');
        expect(typeof site.getPaginateParams).toBe('function');

        const pageParams = site.getPaginateParams(2);
        expect(pageParams.path || pageParams.payload?.url || (pageParams as any).url).toBe('https://www.fortscunha.com.br/imoveis?page=2');
    });

    it('should parse mock HTML correctly', async () => {
        const mockHtml = `
            <div class="recent-properties-box">
                <a href="/imoveis/detalhes/123"><img class="img-responsive" src="/img/1.jpg" /></a>
                <div class="tag-s">venda</div>
                <h3 class="title"><a href="/imoveis/detalhes/123">Casa Linda</a></h3>
                <div class="location">Jardim Tropical, Franca</div>
                <div class="price">R$ 500.000</div>
                <ul class="facilities-list">
                    <li><i class="flaticon-bed"></i> 3 Quartos</li>
                    <li><i class="flaticon-holidays"></i> 2 Banheiros</li>
                    <li><i class="flaticon-vehicle"></i> 2 Vagas</li>
                </ul>
            </div>
        `;
        const { imoveis, qtd } = await adapter(mockHtml);
        expect(imoveis.length).toBe(1);
        expect(qtd).toBe(50);
        expect(imoveis[0].valor).toBe(500000);
        expect(imoveis[0].quartos).toBe(3);
        expect(imoveis[0].banheiros).toBe(2);
        expect(imoveis[0].vagas).toBe(2);
        expect(imoveis[0].endereco).toBe('JARDIM TROPICAL');
        expect(imoveis[0].titulo).toBe('Casa Linda');
    });

    it('should handle zero results', async () => {
        const { imoveis, qtd } = await adapter('<html></html>');
        expect(imoveis.length).toBe(0);
        expect(qtd).toBe(0);
    });
});
