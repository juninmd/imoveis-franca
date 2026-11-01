import novaaliancaimoveis, { adapter } from '../src/sites/novaaliancaimoveis';

describe('novaaliancaimoveis', () => {
  it('should be configured correctly', () => {
    expect(novaaliancaimoveis.name).toBe('novaaliancaimoveis.com.br');
  });

  it('adapter should parse imoveis safely', async () => {
    const html = `
      <div class="pagination-info">Página 1 de 10</div>
      <div class="property-card">
        <a href="/imovel/123">Link</a>
        <h2 class="title">Lindo apartamento</h2>
        <div class="address">Centro, Franca, SP</div>
        <div class="price">R$ 350.000,00</div>
        <ul class="features">
          <li>100 m²</li>
          <li>3 quartos</li>
          <li>2 banheiros</li>
          <li>1 vaga</li>
        </ul>
        <img src="https://example.com/img.jpg" />
      </div>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(10);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Lindo apartamento');
    expect(result.imoveis[0].valor).toBe(350000);
    expect(result.imoveis[0].area).toBe(100);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].vagas).toBe(1);
  });
});
