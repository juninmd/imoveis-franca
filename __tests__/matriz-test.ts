import { adapter } from '../src/sites/matriz';

describe('matriz.site adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <html>
        <body>
          <p>Exibindo 2 resultados</p>
          <a href="/imovel/123?finalidade=Venda" class="group hover:bg-background">
            <img src="/img1.jpg" />
            <h3 class="font-semibold">Casa em Franca</h3>
            <div class="text-secondary uppercase">Bairro</div>
            <div>Jardim Francano</div>
            <p>R$ 450.000,00</p>
            <span>150 m²</span>
            <span>3 dorms</span>
            <span>2 banheiros</span>
            <span>2 vagas</span>
          </a>
        </body>
      </html>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(2);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa em Franca');
    expect(result.imoveis[0].endereco).toBe('JARDIM FRANCANO');
    expect(result.imoveis[0].valor).toBe(450000);
    expect(result.imoveis[0].area).toBe(150);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].link).toBe('https://matriz.site/imovel/123?finalidade=Venda');
    expect(result.imoveis[0].imagens[0]).toBe('https://matriz.site/img1.jpg');
  });

  it('should handle zero results', async () => {
    const html = `<html><body></body></html>`;
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });
});
