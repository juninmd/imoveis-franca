import { adapter } from '../src/sites/imobiliarialemos';

describe('imobiliarialemos.com.br adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <html>
        <body>
          <p>Exibindo 2 resultados</p>
          <a href="/comprar/sp/franca/jardim-paulistano/casa/78729512" class="property-item">
            <img src="/img1.jpg" alt="Linda casa" />
            <h3>Casa a Venda</h3>
            <p>R$ 680.000,00</p>
            <span>200 m²</span>
            <span>4 quartos</span>
            <span>3 banheiros</span>
            <span>3 vagas</span>
          </a>
        </body>
      </html>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(2);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa a Venda');
    expect(result.imoveis[0].endereco).toBe('JARDIM PAULISTANO');
    expect(result.imoveis[0].valor).toBe(680000);
    expect(result.imoveis[0].area).toBe(200);
    expect(result.imoveis[0].quartos).toBe(4);
    expect(result.imoveis[0].banheiros).toBe(3);
    expect(result.imoveis[0].vagas).toBe(3);
    expect(result.imoveis[0].link).toBe('https://www.imobiliarialemos.com.br/comprar/sp/franca/jardim-paulistano/casa/78729512');
    expect(result.imoveis[0].imagens[0]).toBe('https://www.imobiliarialemos.com.br/img1.jpg');
  });

  it('should handle zero results', async () => {
    const html = `<html><body></body></html>`;
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });
});
