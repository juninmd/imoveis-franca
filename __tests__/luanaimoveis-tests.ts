import { adapter } from '../src/sites/luanaimoveis';

describe('Luana Imóveis Adapter', () => {
  it('should parse HTML and JSON-LD correctly', async () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">{}</script>
          <script type="application/ld+json">
            {
              "itemListElement": [
                {
                  "item": {
                    "name": "Apartamento de 45 m² 2 Quartos",
                    "url": "/imovel/123",
                    "address": {
                      "streetAddress": "Centro",
                      "addressLocality": "Franca"
                    },
                    "image": ["img1.jpg"],
                    "offers": {
                      "price": 300000
                    }
                  }
                },
                {
                  "item": {
                    "name": "Casa em SP",
                    "url": "/imovel/124",
                    "address": {
                      "streetAddress": "Jardins",
                      "addressLocality": "São Paulo"
                    },
                    "image": [],
                    "offers": {
                      "price": 800000
                    }
                  }
                }
              ]
            }
          </script>
        </head>
      </html>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(1);
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Apartamento de 45 m² 2 Quartos');
    expect(imovel.valor).toBe(300000);
    expect(imovel.quartos).toBe(2);
    expect(imovel.area).toBe(45);
    expect(imovel.endereco).toBe('CENTRO');
  });

  it('should handle broken JSON safely', async () => {
     const html = `
      <script type="application/ld+json">{"itemListElement": [</script>
     `;
     const result = await adapter(html);
     expect(result.imoveis).toHaveLength(0);
  });

  it('should handle empty elements safely', async () => {
     const html = `
      <script type="application/ld+json">{}</script>
      <script type="application/ld+json">
        { "itemListElement": [ { "item": {} }, { "item": { "address": { "addressLocality": "Franca" }, "offers": { "price": 0 } } } ] }
      </script>
     `;
     const result = await adapter(html);
     expect(result.imoveis).toHaveLength(0);
  });
});
