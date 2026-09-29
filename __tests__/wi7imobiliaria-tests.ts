import wi7imobiliaria, { adapter } from '../src/sites/wi7imobiliaria';

describe('wi7imobiliaria', () => {
  it('should return empty when no html is provided', async () => {
    const { imoveis, qtd } = await adapter('<html></html>');
    expect(imoveis.length).toBe(0);
    expect(qtd).toBe(0);
  });

  it('should extract pagination and single-project properties', async () => {
    const html = `
      <ul class="pagination">
        <li><a href="pagina-1">1</a></li>
        <li><a href="pagina-4">4</a></li>
      </ul>
      <div class="thumbnail recent-properties-box">
        <div class="detail">
          <h1><a href="/imovel/casa-123">Casa Linda</a></h1>
        </div>
        <div class="location"><a href="#">Centro</a></div>
        <div class="price">R$ 500.000,00</div>
        <img src="/img1.jpg" />
        <ul class="facilities-list">
          <li>3 quartos</li>
          <li>2 banheiros</li>
          <li>2 vagas</li>
        </ul>
      </div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(48);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Linda em Centro');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].endereco).toBe('CENTRO');
    expect(wi7imobiliaria.getPaginateParams(1)).toEqual({ url: 'https://www.wi7imobiliaria.com.br/imoveis/venda/franca/pagina-1' });
  });

  it('should fallback qtd based on elements count if no pagination', async () => {
    const html = `
      <div class="thumbnail recent-properties-box">
        <div class="detail"><h1><a href="/imovel/123">Casa</a></h1></div>
        <div class="location"><a href="#">Vila Nova</a></div>
        <div class="price">R$ 100.000,00</div>
      </div>
      <div class="thumbnail recent-properties-box"></div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(2);
    expect(imoveis.length).toBe(1);
  });
});
