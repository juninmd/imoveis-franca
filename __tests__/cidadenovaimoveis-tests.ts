import { adapter } from '../src/sites/cidadenovaimoveis';

describe('Cidade Nova Imoveis Adapter', () => {
  it('should get correct paginate params', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const site = require('../src/sites/cidadenovaimoveis').default;
    expect(site.getPaginateParams(2)).toEqual({ url: 'https://cidadenovaimoveis.com.br/imoveis/a-venda/pagina-2' });
  });

  it('should parse HTML correctly', async () => {
    const html = `
      <div class="pagination"><span>1</span><span>2</span></div>
      <a href="/imovel/123-aluga-sala">
        <div class="property-card">
          <img src="https://img.example.com/123.jpg" />
          <h2>Casa à venda</h2>
          <div class="content">
             Vila Chico Júlio, Franca
          </div>
          <h3>R$ 500.000,00</h3>
          <div class="icons">
            26m2 0 1 0 0
          </div>
        </div>
      </a>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(32);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].titulo).toBe('Casa à venda');
    expect(res.imoveis[0].valor).toBe(500000);
  });

  it('should return empty when no listings exist', async () => {
     const html = '<html><body></body></html>';
     const res = await adapter(html);
     expect(res.imoveis.length).toBe(0);
     expect(res.qtd).toBe(0);
  });

  it('should ignore imoveis without valid price', async () => {
     const html = `
      <a href="/imovel/123-aluga-sala">
        <div class="property-card">
          <img src="https://img.example.com/123.jpg" />
          <h2>Casa à venda</h2>
          <div class="content">
             Vila Chico Júlio, Franca
          </div>
          <h3>Sob Consulta</h3>
        </div>
      </a>
     `;
     const res = await adapter(html);
     expect(res.imoveis[0].valor).toBe(0);
  });
});
