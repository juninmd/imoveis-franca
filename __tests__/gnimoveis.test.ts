import site from '../src/sites/gnimoveis';

describe('gnimoveis adapter', () => {
  it('should extract data from HTML', async () => {
    const mockHtml = `
      <body>
        <div>10 Imóveis encontrados</div>
        <div class="property">
          <a href="/imovel/123">Link</a>
          <h2>Casa - Centro</h2>
          <img src="/img.jpg" />
          <p>R$ 200.000</p>
          <span>100 m²</span>
          <span>2 quartos</span>
          <span>1 banheiro</span>
          <span>1 vaga</span>
        </div>
      </body>
    `;

    const result = await site.adapter(mockHtml);
    expect(result.imoveis.length).toBe(1);
    expect(result.qtd).toBe(10);

    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Casa - Centro');
    expect(imovel.link).toBe('https://www.gnimoveis.com.br/imovel/123');
    expect(imovel.imagens).toEqual(['https://www.gnimoveis.com.br/img.jpg']);
    expect(imovel.valor).toBe(200000);
    expect(imovel.area).toBe(100);
    expect(imovel.quartos).toBe(2);
    expect(imovel.banheiros).toBe(1);
    expect(imovel.vagas).toBe(1);
  });
});
