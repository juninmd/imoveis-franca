import { adapter } from '../src/sites/cidadenovaimoveis';

describe('Cidade Nova Imoveis Adapter', () => {
  it('should get correct paginate params', () => {
    const site = require('../src/sites/cidadenovaimoveis').default;
    expect(site.getPaginateParams(2)).toEqual({ url: 'https://cidadenovaimoveis.com.br/imoveis/franca/compra?page=2' });
  });

  it('should parse HTML correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="header-search">
            <h1>1 imóveis encontrados</h1>
          </div>
          <div class="card">
            <a href="/imovel/123">
              <img src="/img/123.jpg" />
            </a>
            <h2 class="title">Casa à venda</h2>
            <div class="location">Jardim Consolação, Franca</div>
            <div class="price">R$ 500.000,00</div>
            <ul class="features">
              <li>3 Quartos</li>
              <li>2 Banheiros</li>
              <li>2 Vagas</li>
              <li>150 m²</li>
            </ul>
          </div>
        </body>
      </html>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(1);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].titulo).toBe('Casa à venda');
    expect(res.imoveis[0].valor).toBe(500000);
    expect(res.imoveis[0].area).toBe(150);
    expect(res.imoveis[0].quartos).toBe(3);
    expect(res.imoveis[0].banheiros).toBe(2);
    expect(res.imoveis[0].vagas).toBe(2);
    expect(res.imoveis[0].endereco).toBe('JARDIM CONSOLACAO');
    expect(res.imoveis[0].link).toBe('https://cidadenovaimoveis.com.br/imovel/123');
    expect(res.imoveis[0].imagens[0]).toBe('https://cidadenovaimoveis.com.br/img/123.jpg');
  });

  it('should ignore imoveis without valid price', async () => {
     const html = `
      <div class="card">
        <a href="/imovel/123">Link</a>
        <div class="price">Consulte-nos</div>
      </div>
      <div class="card">
        <a href="/imovel/124">Link</a>
        <div class="price">0,00</div>
      </div>
     `;
     const res = await adapter(html);
     expect(res.imoveis.length).toBe(0);
  });
});
