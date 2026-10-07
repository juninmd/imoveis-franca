import { adapter } from '../src/sites/cidadenovaimoveis';

describe('Cidade Nova Imoveis Adapter', () => {
  it('should get correct paginate params', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const site = require('../src/sites/cidadenovaimoveis').default;
    expect(site.getPaginateParams(2)).toEqual({ url: 'https://cidadenovaimoveis.com.br/imoveis/franca/compra?page=2' });
  });

  it('should parse HTML correctly', async () => {
    const html = `
      <html><body>
        <h3 class="mb-0">121 imóveis encontrados</h3>
        <a href="https://cidadenovaimoveis.com.br/imovel/123-casa" id="property-card-1"><div class="property-card">
            <img src="https://beagle.dev.br/img/1.webp" />
            <h2 class="h5">Casa à venda</h2>
            <p class="h5 fs-xs text-muted mb-2">
              <span data-tooltip="Área total em Metros quadrados"><i></i> 150.5m2</span>
              <span data-tooltip="suites(s)"><i></i> 1</span>
              <span data-tooltip="quarto(s)"><i></i> 3</span>
              <span data-tooltip="banheiros(s)"><i></i> 2</span>
              <span data-tooltip="vaga(s) garagem"><i></i> 2</span>
            </p>
            <p class="text-muted mb-2 small">Jardim Consolação, Franca</p>
            <h3 class="fw-bold text-primary mb-3 h4">
              R$ 500.000,00
            </h3>
          </div></a>
      </body></html>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(121);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].titulo).toBe('Casa à venda');
    expect(res.imoveis[0].valor).toBe(500000);
    expect(res.imoveis[0].area).toBe(150.5);
    expect(res.imoveis[0].quartos).toBe(3);
    expect(res.imoveis[0].banheiros).toBe(2);
    expect(res.imoveis[0].vagas).toBe(2);
    expect(res.imoveis[0].endereco).toBe('JARDIM CONSOLACAO');
    expect(res.imoveis[0].link).toBe('https://cidadenovaimoveis.com.br/imovel/123-casa');
    expect(res.imoveis[0].imagens[0]).toBe('https://beagle.dev.br/img/1.webp');
  });

  it('should ignore imoveis without valid price', async () => {
     const html = `
      <a href="/imovel/123" id="property-card-2"><div class="property-card">
            <img src="https://beagle.dev.br/img/2.webp" />
            <h2 class="h5">Casa à venda</h2>
            <p class="h5 fs-xs text-muted mb-2">
              <span data-tooltip="Área total em Metros quadrados"><i></i> 150.5m2</span>
              <span data-tooltip="suites(s)"><i></i> 1</span>
              <span data-tooltip="quarto(s)"><i></i> 3</span>
              <span data-tooltip="banheiros(s)"><i></i> 2</span>
              <span data-tooltip="vaga(s) garagem"><i></i> 2</span>
            </p>
            <p class="text-muted mb-2 small">Jardim Consolação, Franca</p>
            <h3 class="fw-bold text-primary mb-3 h4">
              A consultar
            </h3>
          </div></a>
      <a href="/imovel/124" id="property-card-3"><div class="property-card">
            <img src="https://beagle.dev.br/img/3.webp" />
            <h2 class="h5">Casa à venda</h2>
            <p class="h5 fs-xs text-muted mb-2">
              <span data-tooltip="Área total em Metros quadrados"><i></i> 150.5m2</span>
              <span data-tooltip="suites(s)"><i></i> 1</span>
              <span data-tooltip="quarto(s)"><i></i> 3</span>
              <span data-tooltip="banheiros(s)"><i></i> 2</span>
              <span data-tooltip="vaga(s) garagem"><i></i> 2</span>
            </p>
            <p class="text-muted mb-2 small">Jardim Consolação, Franca</p>
            <h3 class="fw-bold text-primary mb-3 h4">
              R$ 0,00
            </h3>
          </div></a>
     `;
     const res = await adapter(html);
     expect(res.imoveis.length).toBe(0);
  });
});
