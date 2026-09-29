import { adapter as agessaniAdapter } from '../src/sites/agessani';
import { adapter as luanaAdapter } from '../src/sites/luanaimoveis';
import { adapter as wi7Adapter } from '../src/sites/wi7imobiliaria';
import { adapter as fortsAdapter } from '../src/sites/fortscunha';

describe('Novos Sites Scraper Adapters', () => {

  describe('agessani', () => {
    it('deve extrair imóveis corretamente', async () => {
      const html = `
        <html>
          <body>
            <div class="pagination"><a href="#">2</a></div>
            <div class="recent-properties-box">
              <span class="tag-s">Venda</span>
              <div class="title"><a href="/imovel/123">Casa no Centro</a></div>
              <div class="location">Centro, Franca - SP</div>
              <div class="price">R$ 500.000</div>
              <ul class="facilities-list">
                <li><i class="flaticon-bed"></i> 3 Quartos</li>
                <li><i class="flaticon-holidays"></i> 2 Banheiros</li>
                <li><i class="flaticon-vehicle"></i> 2 Vagas</li>
              </ul>
              <img class="img-responsive" src="http://agessani.com/img1.jpg" />
            </div>
          </body>
        </html>
      `;
      const result = await agessaniAdapter(html);
      expect(result.qtd).toBe(24); // max pagination(2) * 12
      expect(result.imoveis).toHaveLength(1);
      expect(result.imoveis[0].titulo).toBe('Casa no Centro');
      expect(result.imoveis[0].valor).toBe(500000);
      expect(result.imoveis[0].quartos).toBe(3);
    });

    it('deve lidar com ausência de dados', async () => {
       const html = `<html><body><div class="recent-properties-box"><div class="title">No Link</div></div></body></html>`;
       const result = await agessaniAdapter(html);
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
    it('deve extrair imóveis corretamente', async () => {
      const html = `
        <html>
          <body>
            <div class="property-box">
              <span class="badge">venda</span>
              <h3><a href="/imovel/f">Terreno Bom</a></h3>
              <div class="address">Distrito Ind.</div>
              <div class="price">R$ 150.000</div>
              <ul class="features">
                <li><i class="icon-bed"></i> 0 Quartos</li>
              </ul>
              <img src="http://forts.com/img4.jpg" />
            </div>
          </body>
        </html>
      `;
      const result = await fortsAdapter(html);
      expect(result.qtd).toBe(50);
      expect(result.imoveis).toHaveLength(1);
      expect(result.imoveis[0].link).toBe('https://www.fortscunha.com.br/imovel/f');
      expect(result.imoveis[0].quartos).toBe(0);
      expect(result.imoveis[0].imagens[0]).toBe('http://forts.com/img4.jpg');
    });

    it('deve lidar com tag aluguel', async () => {
       const html = `<html><body><div class="property-box"><span class="badge">Aluguel</span><h3><a href="/imovel/f">X</a></h3></div></body></html>`;
       const result = await fortsAdapter(html);
       expect(result.imoveis).toHaveLength(0);
    });
  });
});
