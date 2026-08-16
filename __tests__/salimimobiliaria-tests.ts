import { adapter } from '../src/sites/salimimobiliaria';

describe('salimimobiliaria adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <body>
        7 imóveis encontrados
        <div class="col-md-4">
          <a href="/imovel/123">
            <h2 class="imovel-title">Casa Teste</h2>
            <div class="imovel-address">Franca - Jardim Teste</div>
            <div class="imovel-price">R$ 300.000</div>
            <span>150 m²</span>
            <span>3 dormitórios</span>
            <span>2 suítes</span>
            <span>2 vagas</span>
            <img src="/img.jpg" />
          </a>
        </div>
      </body>
    `;

    const result = await adapter(html);
    expect(result.qtd).toBe(7);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].valor).toBe(300000);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].area).toBe(150);
    expect(result.imoveis[0].endereco).toBe('JARDIM TESTE');
    expect(result.imoveis[0].imagens[0]).toBe('https://www.salimimobiliaria.com.br/img.jpg');
    expect(result.imoveis[0].link).toBe('https://www.salimimobiliaria.com.br/imovel/123');
  });

  it('should handle zero properties', async () => {
    const html = `<body>Nenhum imóvel encontrado</body>`;
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });
});
