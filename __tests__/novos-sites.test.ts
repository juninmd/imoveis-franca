import wi7imobiliaria from '../src/sites/wi7imobiliaria';
import fortscunha from '../src/sites/fortscunha';
import luanaimoveis from '../src/sites/luanaimoveis';

describe('Mais Novos Sites', () => {
    it('wi7imobiliaria parses correctly', async () => {
       const html = `
        <div class="recent-properties-box">
            <div class="title"><a href="/imovel/123">Barracão em Jardim Luiza II</a></div>
            <div class="location">Franca, SP</div>
            <div class="tag-s">venda</div>
            <div class="price">R$ 1.700,00</div>
        </div>
       `;
       const res = await wi7imobiliaria.adapter(html);
       expect(res.imoveis.length).toBe(1);
       expect(res.imoveis[0].titulo).toBe('Barracão em Jardim Luiza II');
       expect(res.imoveis[0].valor).toBe(1700);
    });

    it('fortscunha parses correctly', async () => {
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
            <div class="valor-pacote">R$ 300.000,00</div>
            <a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro"><div class="lower-content2">Venda</div></a>
          </div></div>`;
       const res = await fortscunha.adapter(html);
       expect(res.imoveis.length).toBe(1);
       expect(res.imoveis[0].titulo).toBe('Casa Linda em Centro');
       expect(res.imoveis[0].valor).toBe(300000);
    });

    it('luanaimoveis stub', async () => {
       expect(luanaimoveis.getPaginateParams(1)).toEqual({ url: 'https://www.luanaimoveis.com.br/imoveis?page=1' });
    });
});
