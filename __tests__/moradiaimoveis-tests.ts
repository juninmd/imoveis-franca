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
            <span class="quantidade">(2 imóveis)</span>
            <div id="resultados" class="resultados">
              <div id="8525602" class="resultado">
                <div class="foto"><a href="/comprar/sp/franca/vila-santa-rita/apartamento/8525602"><img src="/img/teste.jpg" /></a></div>
                <div class="info_imoveis">
                  <h3 class="tipo">APARTAMENTO</h3>
                  <h4 class="cidade">Franca - SP</h4>
                  <h4 class="bairro">Vila Santa Rita</h4>
                  <div class="valor"><small>Venda</small><h5>R$ 350.000,00</h5></div>
                  <div class="detalhes">
                    <div title="Dormitórios" class="detalhe"><i class="fa fa-bed"></i><span>2</span></div>
                    <div title="Banheiros" class="detalhe"><i class="fa fa-bath"></i><span>1</span></div>
                    <div title="Vagas" class="detalhe"><i class="fa fa-car"></i><span>1</span></div>
                    <div title="Área" class="detalhe"><i class="fa fa-expand"></i><span>50.00</span><span>m²</span></div>
                  </div>
                </div>
              </div>
              <div id="8525416" class="resultado">
                <div class="foto"><a href="/alugar/sp/franca/sao-jose/casa/8525416"><img src="/img/rental.jpg" /></a></div>
                <div class="info_imoveis">
                  <h3 class="tipo">CASA</h3>
                  <h4 class="cidade">Franca - SP</h4>
                  <h4 class="bairro">São José</h4>
                  <div class="valor"><small>Locação</small><h5>R$ 5.000,00</h5></div>
                  <div class="detalhes">
                    <div title="Dormitórios" class="detalhe"><i class="fa fa-bed"></i><span>3</span></div>
                    <div title="Banheiros" class="detalhe"><i class="fa fa-bath"></i><span>2</span></div>
                    <div title="Vagas" class="detalhe"><i class="fa fa-car"></i><span>2</span></div>
                    <div title="Área" class="detalhe"><i class="fa fa-expand"></i><span>150.00</span><span>m²</span></div>
                  </div>
                </div>
              </div>
            </div>
            `;
        const result = await adapter(mockHtml);
        expect(result.qtd).toBe(2);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].titulo).toBe('APARTAMENTO - Vila Santa Rita');
        expect(result.imoveis[0].valor).toBe(350000);
        expect(result.imoveis[0].area).toBe(50);
        expect(result.imoveis[0].quartos).toBe(2);
        expect(result.imoveis[0].banheiros).toBe(1);
        expect(result.imoveis[0].vagas).toBe(1);
        expect(result.imoveis[0].link).toBe('https://www.moradiaimoveisfranca.com.br/comprar/sp/franca/vila-santa-rita/apartamento/8525602');
        expect(result.imoveis[0].imagens).toEqual(['https://www.moradiaimoveisfranca.com.br/img/teste.jpg']);
    });

    it('should return zero items when there are no results', async () => {
        const mockHtml = `
            <span class="quantidade">(0 imóveis)</span>
            <div id="resultados" class="resultados"></div>
            `;
        const result = await adapter(mockHtml);
        expect(result.qtd).toBe(0);
        expect(result.imoveis).toHaveLength(0);
    });
});
