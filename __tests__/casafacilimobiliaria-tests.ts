import casafacilimobiliaria, { adapter } from '../src/sites/casafacilimobiliaria';

describe('casafacilimobiliaria', () => {
  it('should be enabled and valid', () => {
    expect(casafacilimobiliaria.enabled).toBe(true);
    expect(casafacilimobiliaria.name).toBe('casafacilimobiliaria.com.br');
    expect(casafacilimobiliaria.getPaginateParams(1)).toEqual({ url: 'https://casafacilimobiliaria.com.br/comprar/sp/franca?pag=1' });
  });

  it('should parse imoveis correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="texto-resultados">1 imóveis</div>
          <div class="imovel-card">
            <a href="/imovel/123">Link</a>
            <div class="imovel-titulo">Casa linda</div>
            <div class="imovel-bairro">Centro</div>
            <div class="imovel-valor">500000</div>
            <ul class="imovel-caracteristicas">
              <li>150 m²</li>
              <li>3 quartos</li>
              <li>2 banheiros</li>
              <li>2 vagas</li>
            </ul>
            <div class="imovel-foto"><img src="/foto1.jpg"></div>
          </div>
        </body>
      </html>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(1);
    expect(res.imoveis).toHaveLength(1);
    expect(res.imoveis[0].titulo).toBe('Casa linda');
    expect(res.imoveis[0].link).toBe('https://casafacilimobiliaria.com.br/imovel/123');
    expect(res.imoveis[0].imagens).toEqual(['https://casafacilimobiliaria.com.br/foto1.jpg']);
  });

  it('should handle zero states', async () => {
    const html = `<html><body><div class="imovel-card"><a href="http://link"></a><div class="imovel-titulo">T</div><div class="imovel-valor">10</div><ul class="imovel-caracteristicas"><li>quarto</li><li>banheiro</li><li>vaga</li></ul><div class="imovel-foto"><img data-src="http://img"></div></div></body></html>`;
    const res = await adapter(html);
    expect(res.qtd).toBe(1);
    expect(res.imoveis).toHaveLength(1);
  });

  it('should ignore if no link or titulo', async () => {
     const html = `<html><body><div class="imovel-card"><div class="imovel-titulo">T</div></div><div class="imovel-card"><a href="link"></a></div></body></html>`;
     const res = await adapter(html);
     expect(res.imoveis).toHaveLength(0);
  });

  it('should handle zero imoveis', async () => {
    const res = await adapter('<html><body></body></html>');
    expect(res.qtd).toBe(0);
  });
});
