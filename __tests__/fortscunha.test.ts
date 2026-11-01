import site, { adapter } from '../src/sites/fortscunha';

describe('fortscunha site', () => {
    it('should match fastimob adapter signature and exported object', async () => {
        expect(site.enabled).toBe(true);
        expect(site.name).toBe('fortscunha.com.br');
        expect(site.driver).toBe('axios');
        expect(site.url).toBe('https://www.fortscunha.com.br/imoveis');
        expect(typeof site.getPaginateParams).toBe('function');

        const pageParams = site.getPaginateParams(2);
        expect(pageParams.path || pageParams.payload?.url || (pageParams as any).url).toBe('https://www.fortscunha.com.br/imoveis');
    });

    it('should parse mock HTML correctly', async () => {
        const mockHtml = `<div class="col-md-3"><div class="single-project">
            <div class="img-box"><img src="https://www.fortscunha.com.br/images-imoveis/a b.jpg" alt="x" /><div class="overlay"><a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro">ver mais</a></div></div>
            <div class="lower-content">
              <div class="valores-imovel"><i class="fa fa-bed"></i><br>3</div>
              <div class="valores-imovel"><i class="fa fa-bath"></i><br>2</div>
              <div class="valores-imovel"><i class="fa fa-car"></i><br>2</div>
              <div class="valores-imovel"><i class="fa fa-arrows"></i><br>120 m²</div>
              <h5><a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro">Casa Linda</a></h5>
              <i class="fa fa-map-marker"></i> Franca - Jardim Tropical<br>
            </div>
            <div class="valor-pacote">R$ 500.000,00</div>
            <a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro"><div class="lower-content2">Venda</div></a>
          </div></div>`;
        const { imoveis, qtd } = await adapter(mockHtml);
        expect(imoveis.length).toBe(1);
        expect(qtd).toBe(1);
        expect(imoveis[0].valor).toBe(500000);
        expect(imoveis[0].quartos).toBe(3);
        expect(imoveis[0].banheiros).toBe(2);
        expect(imoveis[0].vagas).toBe(2);
        expect(imoveis[0].endereco).toBe('JARDIM TROPICAL');
        expect(imoveis[0].titulo).toBe('Casa Linda');
        expect(imoveis[0].area).toBe(120);
    });

    it('should skip rentals and non-Franca properties', async () => {
        const mk = (tipo: string, loc: string) => `<div class="single-project"><div class="overlay"><a href="https://www.fortscunha.com.br/imoveis/1/x">ver</a></div><div class="lower-content"><h5><a href="#">Casa</a></h5><i class="fa fa-map-marker"></i> ${loc}<br></div><div class="valor-pacote">R$ 100.000,00</div><div class="lower-content2">${tipo}</div></div>`;
        const html = `<div class="row">${mk('Aluguel', 'Franca - Centro')}${mk('Venda', 'Rifaina - Centro')}${mk('Venda', 'Franca - Centro')}</div>`;
        const { imoveis, qtd } = await adapter(html);
        expect(imoveis.length).toBe(1);
        expect(qtd).toBe(1);
    });

    it('should handle zero results', async () => {
        const { imoveis, qtd } = await adapter('<html></html>');
        expect(imoveis.length).toBe(0);
        expect(qtd).toBe(0);
    });
});
