import { adapter } from '../src/sites/oasisimobiliaria';

describe('oasisimobiliaria adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <p class="mono">Exibindo 1–9 de 151 imóveis</p>
      <a class="card" href="/imoveis/teste">
        <h3>Teste de imovel</h3>
        <p class="loc">Centro</p>
        <div class="price">R$ 500.000</div>
        <div class="specs">
          <span>100 m²</span>
          <span>3 dormitórios</span>
          <span>2 banheiros</span>
          <span>1 vaga</span>
        </div>
        <div class="photo">
          <img src="http://example.com/img.jpg" />
        </div>
      </a>
      <a class="card" href="/imoveis/aluguel">
        <h3>Teste de aluguel</h3>
        <p class="loc">Centro</p>
        <div class="price">R$ 2.000 /mês</div>
      </a>
      <a class="card">
        <h3>Sem link</h3>
      </a>
      <a class="card" href="/imoveis/invalido">
        <!-- Sem titulo -->
      </a>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(151);
    expect(result.imoveis.length).toBe(1);

    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Teste de imovel');
    expect(imovel.endereco).toBe('CENTRO');
    expect(imovel.valor).toBe(500000);
    expect(imovel.area).toBe(100);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(1);
    expect(imovel.link).toBe('https://oasisimobiliaria.com.br/imoveis/teste');
    expect(imovel.imagens).toEqual(['http://example.com/img.jpg']);
    expect(imovel.site).toBe('oasisimobiliaria.com.br');
  });

  it('should handle zero qtd when text does not match', async () => {
    const html = '<p class="mono">Nenhum resultado</p>';
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });

  it('should handle alternative image sources', async () => {
     const html = `
      <p class="mono">Exibindo 1–9 de 151 imóveis</p>
      <a class="card" href="/imoveis/teste2">
        <h3>Teste de imovel 2</h3>
        <p class="loc">Centro</p>
        <div class="price">R$ 1.500.000</div>
        <div class="photo">
          <img src="data:image/svg" data-lazy-src="/img2.jpg" />
        </div>
      </a>
    `;
    const result = await adapter(html);
    expect(result.imoveis[0].imagens).toEqual(['https://oasisimobiliaria.com.br/img2.jpg']);
  });
});
