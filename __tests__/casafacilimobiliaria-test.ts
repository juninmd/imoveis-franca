import casafacilimobiliaria, { adapter } from '../src/sites/casafacilimobiliaria';

describe('casafacilimobiliaria', () => {
  it('should return site configuration', () => {
    expect(casafacilimobiliaria.name).toBe('casafacilimobiliaria.com.br');
    expect(casafacilimobiliaria.enabled).toBe(true);
    expect(casafacilimobiliaria.getPaginateParams(2)).toEqual({
      url: 'https://casafacilimobiliaria.com.br/comprar/sp/franca?pag=2'
    });
  });

  it('should parse an empty HTML and return 0 imoveis', async () => {
    const html = '<html><body></body></html>';
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });

  it('should parse valid HTML and extract properties correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="texto-resultados">5 imóveis encontrados</div>
          <div class="imovel-card">
             <a href="/imovel/123/casa">Detalhes</a>
             <div class="imovel-titulo">Linda Casa em Franca</div>
             <div class="imovel-bairro">Jardim Consolação</div>
             <div class="imovel-valor">500.000,00</div>
             <ul class="imovel-caracteristicas">
                <li>100 m²</li>
                <li>3 Quartos</li>
                <li>2 Banheiros</li>
                <li>2 Vagas</li>
             </ul>
             <div class="imovel-foto">
               <img src="/img/1.jpg" />
             </div>
          </div>
        </body>
      </html>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(5);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Linda Casa em Franca');
    expect(result.imoveis[0].endereco).toBe('JARDIM CONSOLACAO');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].area).toBe(100);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].link).toBe('https://casafacilimobiliaria.com.br/imovel/123/casa');
    expect(result.imoveis[0].imagens).toEqual(['https://casafacilimobiliaria.com.br/img/1.jpg']);
  });

  it('should parse incomplete property safely', async () => {
    const html = `
      <html>
        <body>
          <div class="imovel-card">
             <a href="/imovel/124/lote">Detalhes</a>
             <div class="imovel-titulo">Lote vazio</div>
             <!-- missing bairro and characteristics -->
             <div class="imovel-valor">100.000,00</div>
          </div>
        </body>
      </html>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(1); // falls back to imoveis.length
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].endereco).toBe('LOTE VAZIO');
    expect(result.imoveis[0].area).toBe(0);
  });

  it('should parse without link correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="imovel-card">
             <div class="imovel-titulo">Lote vazio</div>
             <div class="imovel-valor">100.000,00</div>
          </div>
        </body>
      </html>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });

  it('should parse without title correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="imovel-card">
             <a href="/imovel/124/lote">Detalhes</a>
             <div class="imovel-valor">100.000,00</div>
          </div>
        </body>
      </html>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });
});
