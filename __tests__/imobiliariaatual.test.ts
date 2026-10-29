import imobiliariaatual, { adapter } from '../src/sites/imobiliariaatual';

describe('imobiliariaatual', () => {
  it('should be configured correctly', () => {
    expect(imobiliariaatual.name).toBe('imobiliariaatual.com.br');
  });

  it('adapter should parse imoveis safely', async () => {
    const html = `
      <div class="total-imoveis">25 imóveis encontrados</div>
      <div class="card">
        <a href="/imovel/abc">Detalhes</a>
        <h3 class="title">Casa maravilhosa</h3>
        <div class="endereco">Vila Nova, Franca, SP</div>
        <div class="price">R$ 500.000,00</div>
        <ul class="amenities">
          <li>200 m²</li>
          <li>4 quartos</li>
          <li>3 banheiros</li>
          <li>2 vagas</li>
        </ul>
        <img src="https://example.com/casa.jpg" />
      </div>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(25);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa maravilhosa');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].area).toBe(200);
    expect(result.imoveis[0].quartos).toBe(4);
    expect(result.imoveis[0].vagas).toBe(2);
  });
});
