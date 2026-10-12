import { adapter } from '../src/sites/jedisonimoveis';

describe('jedisonimoveis adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <div class="box_imovel">
        <h2 class="titulo_imovel">Casa Maravilhosa</h2>
        <a href="/imovel/123">Link</a>
        <div class="valor_imovel">R$ 500.000</div>
        <img src="img.jpg" />
        <div class="info">3 Quartos 2 Banheiros 1 Vaga 100 m²</div>
        <div class="bairro_imovel">Centro - Franca</div>
      </div>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa Maravilhosa');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].endereco).toBe('CENTRO');
  });

  it('should parse pagination correctly', async () => {
    const html = `
      <div class="box_imovel">
        <h2 class="titulo_imovel">Casa</h2>
        <a href="/imovel/123">Link</a>
        <div class="valor_imovel">R$ 500.000</div>
      </div>
      <div class="paginacao">
        <a href="?pagina=1">1</a>
        <a href="?pagina=2">2</a>
        <a href="?pagina=3">3</a>
      </div>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(36);
  });
});
