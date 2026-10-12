import { adapter } from '../src/sites/jardiniimoveis';

describe('jardiniimoveis adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <body>583 imóveis</body>
      <div class="property group">
        <h2>Casa Maravilhosa</h2>
        <a href="/imovel/123">Link</a>
        <p>R$ 500.000</p>
        <img src="img.jpg" />
        <p>3 Quartos 2 Banheiros 1 Vaga 100 m²</p>
        <p>Centro, Franca</p>
      </div>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(583);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa Maravilhosa');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].quartos).toBe(3);
  });
});
