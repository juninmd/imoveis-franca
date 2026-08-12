import site, { adapter } from '../src/sites/moradiaimoveis';

describe('moradiaimoveisfranca.com.br site scraper', () => {
    it('should have correct basic site configuration', () => {
        expect(site.name).toBe('moradiaimoveisfranca.com.br');
        expect(site.url).toContain('https://www.moradiaimoveisfranca.com.br');
        expect(site.driver).toBe('axios');
        expect(site.itemsPerPage).toBe(12);
    });

    it('should calculate pagination params correctly', () => {
        const params = site.getPaginateParams(2);
        expect(params).toEqual({ url: 'https://www.moradiaimoveisfranca.com.br/imoveis/a-venda/pagina-2' });
    });

    it('should parse html and extract imoveis correctly', async () => {
        const mockHtml = `
            <div class="resultados">9 imóveis</div>
            <div class="resultado">
              <div class="foto">
                <a href="/comprar/teste"><img src="/img/teste.jpg" /></a>
              </div>
              <div class="info_imoveis">
                <h3 class="tipo">CASA</h3><h4 class="bairro">Centro</h4>
                <div class="valor"><h5>R$ 350.000,00</h5></div>
                <div class="detalhes">
                   <div class="detalhe" title="Área">100m²</div>
                   <div class="detalhe" title="Dormitórios">3</div>
                </div>
              </div>
            </div>
            `;
        const result = await adapter(mockHtml);
        expect(result.qtd).toBe(9);
        expect(result.imoveis.length).toBeGreaterThan(0);
        expect(result.imoveis[0].titulo).toBe('CASA - Centro');
        expect(result.imoveis[0].valor).toBe(350000);
        expect(result.imoveis[0].area).toBe(100);
        expect(result.imoveis[0].quartos).toBe(3);
    });
});
