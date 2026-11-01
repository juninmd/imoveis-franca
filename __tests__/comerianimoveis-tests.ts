import comerianimoveis, { adapter } from '../src/sites/comerianimoveis';

describe('comerianimoveis', () => {
  it('should be enabled and valid', () => {
    expect(comerianimoveis.enabled).toBe(true);
    expect(comerianimoveis.name).toBe('comerianimoveis.com.br');
    expect(comerianimoveis.getPaginateParams(1)).toEqual({ url: 'https://www.comerianimoveis.com.br/imovel/?finalidade=venda&pag=1' });
  });

  it('should parse JSON-LD scripts correctly', async () => {
    const html = `
      <html>
        <body>
          <div class="resultado">1</div>
          <script type="application/ld+json">
          {
            "@type": "BuyAction",
            "object": {
              "name": "Casa teste JSON",
              "url": "https://www.comerianimoveis.com.br/imovel/123",
              "image": "http://img1.jpg"
            }
          }
          </script>
          <div class="item-lista">
             <a href="/imovel/123">Link</a>
             <div class="endereco">Centro</div>
             <li>R$ 500.000</li>
             <p>150 m² 3 quartos 2 banheiros 2 vagas</p>
          </div>
        </body>
      </html>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(1);
    expect(res.imoveis).toHaveLength(1);
    expect(res.imoveis[0].titulo).toBe('Casa teste JSON');
    expect(res.imoveis[0].valor).toBe(500000);
    expect(res.imoveis[0].link).toBe('https://www.comerianimoveis.com.br/imovel/123');
  });

  it('should parse DOM elements if JSON-LD parsing fails', async () => {
    const html = `
      <html>
        <body>
          <div class="resultado">1</div>
          <script type="application/ld+json">
             invalid json
          </script>
          <div class="item-lista">
             <a href="/imovel/456">Link</a>
             <h2>Casa Teste DOM</h2>
             <div class="endereco">Vila Nova</div>
             <b>R$ 300.000</b>
             <p>100 m² 2 dormitórios 1 suíte 1 garagem</p>
             <img src="/foto.jpg">
          </div>
        </body>
      </html>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(1);
    expect(res.imoveis).toHaveLength(1);
    expect(res.imoveis[0].titulo).toBe('Casa Teste DOM');
    expect(res.imoveis[0].valor).toBe(300000);
    expect(res.imoveis[0].link).toBe('https://www.comerianimoveis.com.br/imovel/456');
    expect(res.imoveis[0].imagens).toEqual(['https://www.comerianimoveis.com.br/foto.jpg']);
  });

  it('should handle missing fields', async () => {
    const html = `<html><body><div class="item-lista"><a href="http://link"></a><b>R$ 1000</b></div></body></html>`;
    const res = await adapter(html);
    expect(res.imoveis).toHaveLength(1);
    expect(res.imoveis[0].valor).toBe(1000);
  });

  it('should handle zero imoveis', async () => {
    const res = await adapter('<html><body></body></html>');
    expect(res.qtd).toBe(0);
  });
});
