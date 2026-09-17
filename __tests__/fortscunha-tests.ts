import fortscunha, { adapter } from '../src/sites/fortscunha';

describe('fortscunha', () => {
  it('should return empty when no html is provided', async () => {
    const { imoveis, qtd } = await adapter('<html></html>');
    expect(imoveis.length).toBe(0);
    expect(qtd).toBe(0);
  });

  it('should extract pagination and single-project properties', async () => {
    const html = `
      <ul class="pagination">
        <li><a href="pagina=1">1</a></li>
        <li><a href="pagina=3">3</a></li>
      </ul>
      <div class="single-project">
        <h5><a href="/imoveis/123/casa">Casa Linda</a></h5>
        <div class="lower-content">Franca - Centro</div>
        <div class="valor-pacote">R$ 500.000,00</div>
        <img src="/img1.jpg" />
        <div class="valores-imovel">fa-bed 3</div>
        <div class="valores-imovel">fa-bath 2</div>
        <div class="valores-imovel">fa-car 2</div>
      </div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(36);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Linda em Centro');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].endereco).toBe('CENTRO');
    expect(fortscunha.getPaginateParams(1)).toEqual({ url: 'https://www.fortscunha.com.br/imoveis?pagina=1' });
  });

  it('should fallback qtd based on single-project count if no pagination', async () => {
    const html = `
      <div class="single-project">
        <h5><a href="/imoveis/123/casa">Casa</a></h5>
        <div class="lower-content">Franca - Vila Nova</div>
        <div class="valor-pacote">R$ 100.000,00</div>
      </div>
      <div class="single-project"></div>
    `;
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(2);
    expect(imoveis.length).toBe(1);
  });
});
