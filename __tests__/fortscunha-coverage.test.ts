import site from '../src/sites/fortscunha';

describe('Forts Cunha Site', () => {
    it('should parse html correctly', async () => {
        const html = `<div class="col-md-3"><div class="single-project">
            <div class="img-box"><img src="https://www.fortscunha.com.br/images-imoveis/a b.jpg" alt="x" /><div class="overlay"><a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro">ver mais</a></div></div>
            <div class="lower-content">
              <div class="valores-imovel"><i class="fa fa-bed"></i><br>3</div>
              <div class="valores-imovel"><i class="fa fa-bath"></i><br>2</div>
              <div class="valores-imovel"><i class="fa fa-car"></i><br>2</div>
              <div class="valores-imovel"><i class="fa fa-arrows"></i><br>120 m²</div>
              <h5><a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro">Casa Linda em Centro</a></h5>
              <i class="fa fa-map-marker"></i> Franca - Centro<br>
            </div>
            <div class="valor-pacote">R$ 500.000,00</div>
            <a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro"><div class="lower-content2">Venda</div></a>
          </div></div>`;
        const res = await site.adapter(html);
        expect(res.imoveis.length).toBe(1);
        expect(res.imoveis[0].titulo).toBe('Casa Linda em Centro');
        expect(res.imoveis[0].quartos).toBe(3);
    });

    it('should handle zero area properly', async () => {
        const html = `<div class="col-md-3"><div class="single-project">
            <div class="img-box"><img src="https://www.fortscunha.com.br/images-imoveis/a b.jpg" alt="x" /><div class="overlay"><a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro">ver mais</a></div></div>
            <div class="lower-content">
              <div class="valores-imovel"><i class="fa fa-bed"></i><br>0</div>
              <div class="valores-imovel"><i class="fa fa-bath"></i><br>0</div>
              <div class="valores-imovel"><i class="fa fa-car"></i><br>0</div>
              <div class="valores-imovel"><i class="fa fa-arrows"></i><br>      m²</div>
              <h5><a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro">Casa Linda em Centro</a></h5>
              <i class="fa fa-map-marker"></i> Franca - Centro<br>
            </div>
            <div class="valor-pacote">R$ 500.000,00</div>
            <a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro"><div class="lower-content2">Venda</div></a>
          </div></div>`;
        const res = await site.adapter(html);
        expect(res.imoveis[0].area).toBe(0);
        expect(res.imoveis[0].precoPorMetro).toBe(0);
    });
});
