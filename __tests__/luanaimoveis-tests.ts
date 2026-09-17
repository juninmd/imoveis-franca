import luanaimoveis, { adapter } from '../src/sites/luanaimoveis';

describe('luanaimoveis', () => {
  it('should return empty when no html is provided or on error', async () => {
    const { imoveis, qtd } = await adapter('<html></html>');
    expect(imoveis.length).toBe(0);
    expect(qtd).toBe(0);
  });

  it('should extract pagination and single-project properties from DOM', async () => {
    const html = `
      <ul class="pagination">
        <li><a href="pagina=1">1</a></li>
        <li><a href="pagina=2">2</a></li>
      </ul>
      <div class="property-item">
        <h2 class="title">Casa Linda</h2>
        <div class="location">Centro</div>
        <div class="price">R$ 500.000,00</div>
        <a href="/imovel/123"></a>
        <img src="/img1.jpg" />
        <ul class="facilities">
          <li>3 quartos</li>
          <li>2 banheiros</li>
          <li>2 vagas</li>
        </ul>
      </div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(24);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Linda em Centro');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].endereco).toBe('CENTRO');
    expect(luanaimoveis.getPaginateParams(1)).toEqual({ url: 'https://www.luanaimoveis.com.br/imoveis/a-venda/franca?pagina=1' });
  });

  it('should fallback qtd based on elements count if no pagination', async () => {
    const html = `
      <div class="property-item">
        <h3 class="title">Casa</h3>
        <div class="location">Vila Nova</div>
        <div class="price">R$ 100.000,00</div>
        <a href="http://link"></a>
      </div>
      <div class="property-item"></div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(2);
    expect(imoveis.length).toBe(1);
  });

  it('should hit the window.$MC path for coverage', async () => {
    const html = `
      <script>window.$MC = { fake: "data" };</script>
      <div class="property-item">
        <h3 class="title">Casa</h3>
        <div class="location">Vila Nova</div>
        <div class="price">R$ 100.000,00</div>
        <a href="http://link"></a>
      </div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(1);
    expect(imoveis.length).toBe(1);
  });
});
