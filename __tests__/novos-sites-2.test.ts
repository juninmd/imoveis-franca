import { adapter as agessaniAdapter } from '../src/sites/agessani';
import { adapter as luanaAdapter } from '../src/sites/luanaimoveis';
import { adapter as wi7Adapter } from '../src/sites/wi7imobiliaria';
import { adapter as fortsAdapter } from '../src/sites/fortscunha';

describe('Novos Sites Scraper Adapters', () => {

  describe('agessani', () => {
    it('deve extrair imóveis corretamente', async () => {
      const html = `
        <html><body>
          <div class="grid-9 caixa-imovel"><div class="item-lista">
  <div class="img-item-lista"><img src="/imagens/imoveis/a.png"></div>
  <div class="desc-item-lista"><h3>Centro, Franca / SP</h3>
  <table><tr>
   <td><a data-tooltip="&Aacute;rea">522 m&sup2;</a></td>
   <td><a data-tooltip="Dormit&oacute;rios">3</a></td>
   <td><a data-tooltip="Banheiros">1</a></td>
   <td><a data-tooltip="Vagas">2</a></td>
  </tr></table>
  <ul><li>R$ 500.000,00</li><li><a href="/imovel/123/casa-venda" title="Casa Legal" class="btver">Ver Detalhes</a></li></ul>
  </div></div></div>
          <div class="lista_imoveis_paginacao"><a>1</a><a>2</a></div>
        </body></html>`;
      const result = await agessaniAdapter(html);
      expect(result.qtd).toBe(30); // 2 páginas * 15
      expect(result.imoveis).toHaveLength(1);
      expect(result.imoveis[0].titulo).toBe('Casa Legal');
      expect(result.imoveis[0].valor).toBe(500000);
      expect(result.imoveis[0].quartos).toBe(3);
    });

    it('deve lidar com ausência de dados', async () => {
      const result = await agessaniAdapter('<html><body><div class="item-lista">Sem link</div></body></html>');
      expect(result.imoveis).toHaveLength(0);
      expect(result.qtd).toBe(0);
    });
  });

  describe('luanaimoveis', () => {
    it('deve extrair imóveis corretamente com JSON-LD e DOM fallback', async () => {
      const html = `
        <html>
          <head>
             <script type="application/ld+json">{"@graph": [{"test": 1}]}</script>
          </head>
          <body>
            <div class="property-card">
              <span class="badge">Venda</span>
              <h2 class="title"><a href="/imovel/abc">Apto Lindo</a></h2>
              <div class="location">Vila Nova, SP</div>
              <div class="price">R$ 350.000</div>
              <ul class="features">
                <li>3 quartos</li>
                <li>2 banheiros</li>
                <li>1 vaga</li>
                <li>100 m²</li>
              </ul>
              <img src="/img2.jpg" />
            </div>
          </body>
        </html>
      `;
      const result = await luanaAdapter(html);
      expect(result.qtd).toBe(100);
      expect(result.imoveis).toHaveLength(1);
      expect(result.imoveis[0].valor).toBe(350000);
      expect(result.imoveis[0].area).toBe(100);
      expect(result.imoveis[0].precoPorMetro).toBe(3500);
      expect(result.imoveis[0].link).toBe('https://www.luanaimoveis.com.br/imovel/abc');
    });

    it('deve ignorar imóveis de locação e mal formatados', async () => {
       const html = `<html><body><div class="property-card"><span class="badge">Aluguel</span><a href="/x">X</a></div></body></html>`;
       const result = await luanaAdapter(html);
       expect(result.imoveis).toHaveLength(0);

       // Handle parsing error silently
       const htmlErr = `<html><head><script type="application/ld+json">BAD JSON</script></head><body></body></html>`;
       await expect(luanaAdapter(htmlErr)).resolves.toBeDefined();
    });
  });

  describe('wi7imobiliaria', () => {
    it('deve extrair imóveis corretamente', async () => {
      const html = `
        <html>
          <body>
            <div class="recent-properties-box">
              <span class="tag-f">venda</span>
              <div class="title"><a href="/imovel/w">Casa Top</a></div>
              <div class="location">Jardim Tropical</div>
              <div class="price">R$ 1.200.000</div>
              <ul class="facilities-list">
                <li><i class="flaticon-bed"></i> 4 Quartos</li>
                <li><i class="flaticon-holidays"></i> 3 Banheiros</li>
                <li><i class="flaticon-vehicle"></i> 4 Vagas</li>
              </ul>
              <img class="img-responsive" data-src="/img3.jpg" />
            </div>
          </body>
        </html>
      `;
      const result = await wi7Adapter(html);
      expect(result.qtd).toBe(50); // fallback since no pagination
      expect(result.imoveis).toHaveLength(1);
      expect(result.imoveis[0].titulo).toBe('Casa Top');
      expect(result.imoveis[0].imagens[0]).toBe('https://www.wi7imobiliaria.com.br/img3.jpg');
    });
  });

  describe('fortscunha', () => {
    it('deve extrair imóveis corretamente', async () => {
      const html = `<html><body><div class="col-md-3"><div class="single-project">
            <div class="img-box"><img src="http://forts.com/img4.jpg" alt="x" /><div class="overlay"><a href="https://www.fortscunha.com.br/imoveis/9/terreno">ver mais</a></div></div>
            <div class="lower-content">
              <div class="valores-imovel"><i class="fa fa-bed"></i><br>0</div>
              <div class="valores-imovel"><i class="fa fa-bath"></i><br>2</div>
              <div class="valores-imovel"><i class="fa fa-car"></i><br>2</div>
              <div class="valores-imovel"><i class="fa fa-arrows"></i><br>120 m²</div>
              <h5><a href="https://www.fortscunha.com.br/imoveis/9/terreno">Terreno Bom</a></h5>
              <i class="fa fa-map-marker"></i> Franca - Distrito Ind.<br>
            </div>
            <div class="valor-pacote">R$ 150.000,00</div>
            <a href="https://www.fortscunha.com.br/imoveis/9/terreno"><div class="lower-content2">Venda</div></a>
          </div></div></body></html>`;
      const result = await fortsAdapter(html);
      expect(result.qtd).toBe(1);
      expect(result.imoveis).toHaveLength(1);
      expect(result.imoveis[0].link).toBe('https://www.fortscunha.com.br/imoveis/9/terreno');
      expect(result.imoveis[0].quartos).toBe(0);
      expect(result.imoveis[0].imagens[0]).toBe('http://forts.com/img4.jpg');
    });

    it('deve lidar com tag aluguel', async () => {
       const html = `<html><body><div class="col-md-3"><div class="single-project">
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
            <a href="https://www.fortscunha.com.br/imoveis/1/casa-a-venda--centro"><div class="lower-content2">Aluguel</div></a>
          </div></div></body></html>`;
       const result = await fortsAdapter(html);
       expect(result.imoveis).toHaveLength(0);
    });
  });
});
