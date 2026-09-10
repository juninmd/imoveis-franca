import { adapter } from '../src/sites/zagoimoveis';

describe('Zago Imoveis Adapter', () => {
  it('should parse an empty list when html has no items', async () => {
    const html = '<html><body></body></html>';
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
    expect(result.qtd).toBe(0);
  });

  it('should extract correct number of items', async () => {
    const html = `
      <body>
        <h1 class="titulo_busca">Imóveis à venda  - <b id="count">12</b><span> resultados encontrados.</span></h1>
        <div class="resultado">
            <a href="/comprar/sp/franca/jardim/apartamento/123"></a>
            <div class="dados">
                <h3 class="tipo">Apartamento no Smart</h3>
                <h4 class="localizacao"><span>JARDIM CONSOLAÇÃO - FRANCA/SP</span></h4>
                <div class="detalhes">
                    <div class="detalhe">2 dorm</div>
                    <div class="detalhe">1 suíte</div>
                    <div class="detalhe">2 vagas</div>
                    <div class="detalhe">70 m²</div>
                </div>
                <div class="descricao"><span>Lindo ap</span></div>
                <div class="valor"><h5>R$ 670.000,00</h5></div>
            </div>
            <div class="foto">
                <img src="/img/123.jpg">
            </div>
        </div>
      </body>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.qtd).toBe(12);

    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Apartamento no Smart');
    expect(imovel.endereco).toBe('JARDIM CONSOLACAO');
    expect(imovel.valor).toBe(670000);
    expect(imovel.quartos).toBe(2);
    expect(imovel.banheiros).toBe(1);
    expect(imovel.vagas).toBe(2);
    expect(imovel.area).toBe(70);
    expect(imovel.link).toBe('https://zagoimoveisfranca.com.br/comprar/sp/franca/jardim/apartamento/123');
    expect(imovel.imagens).toEqual(['https://zagoimoveisfranca.com.br/img/123.jpg']);
  });

  it('should handle missing details properly', async () => {
      const html = `
      <body>
        <div class="resultado">
            <a href="/comprar/123"></a>
            <div class="dados">
                <h3 class="tipo">Casa</h3>
                <div class="valor"><h5>R$ 150.000,00</h5></div>
            </div>
        </div>
      </body>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];
    expect(imovel.endereco).toBe('CASA');
  });

  it('should extract area from description if missing in details', async () => {
      const html = `
      <body>
        <div class="resultado">
            <a href="/comprar/123"></a>
            <div class="dados">
                <h3 class="tipo">Terreno</h3>
                <h4 class="localizacao"><span>Centro</span></h4>
                <div class="descricao"><span>Terreno com 250,5 m²</span></div>
                <div class="valor"><h5>R$ 150.000,00</h5></div>
            </div>
        </div>
      </body>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];
    expect(imovel.area).toBe(250.5);
  });

  it('should not add if title is missing', async () => {
      const html = `
      <body>
        <div class="resultado">
            <a href="/comprar/123"></a>
            <div class="dados">
                <div class="valor"><h5>R$ 150.000,00</h5></div>
            </div>
        </div>
      </body>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });
});
