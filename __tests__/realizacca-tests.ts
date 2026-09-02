import { adapter } from '../src/sites/realizacca';

describe('Realiza CCA Adapter', () => {
  it('should get correct paginate params', () => {
    const site = require('../src/sites/realizacca').default;
    expect(site.getPaginateParams(2)).toEqual({ url: 'https://realizacca.com.br/comprar/franca-sp?page=2' });
  });

  it('should parse HTML with JSON correctly', async () => {
    const html = `
      <html>
        <body>
          <script id="__NEXT_DATA__" type="application/json">
            {
              "props": {
                "initialState": {
                  "result": {
                    "pagination": { "total": 2 },
                    "propertys": [
                      {
                        "valSales": 450000,
                        "numUsefulArea": 120,
                        "idtProperty": "123",
                        "namCategory": "Casa",
                        "namCity": "Franca",
                        "namDistrict": "Centro",
                        "jsonPhotos": "[{\\"url\\": \\"http://img.com/1.jpg\\"}]",
                        "namTitle": "Linda Casa",
                        "numBedrooms": 3,
                        "numBathrooms": 2,
                        "numGarage": 2
                      },
                      {
                        "valSale": 0,
                        "idtProperty": "124"
                      }
                    ]
                  }
                }
              }
            }
          </script>
        </body>
      </html>
    `;
    const res = await adapter(html);
    expect(res.qtd).toBe(2);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].titulo).toBe('Linda Casa');
    expect(res.imoveis[0].valor).toBe(450000);
    expect(res.imoveis[0].area).toBe(120);
    expect(res.imoveis[0].quartos).toBe(3);
    expect(res.imoveis[0].banheiros).toBe(2);
    expect(res.imoveis[0].vagas).toBe(2);
    expect(res.imoveis[0].endereco).toBe('CENTRO');
    expect(res.imoveis[0].link).toBe('https://realizacca.com.br/imovel/venda/casa/franca/centro/123');
    expect(res.imoveis[0].imagens[0]).toBe('http://img.com/1.jpg');
  });

  it('should handle pageProps fallback and string arrays for photos', async () => {
     const html = `
      <script id="__NEXT_DATA__" type="application/json">
            {
              "props": {
                "pageProps": {
                  "initialState": {
                    "result": {
                      "pagination": { "total": 1 },
                      "propertys": [
                        {
                          "valSales": 300000,
                          "numUsefulArea": 100,
                          "idtProperty": "123",
                          "namCategory": "Casa",
                          "namCity": "Franca",
                          "namDistrict": "Vila Nova",
                          "photos": [{"url": "http://img.com/1.jpg"}],
                          "namTitle": "Linda Casa",
                          "numBedrooms": 3,
                          "numBathrooms": 2,
                          "numGarage": 2
                        }
                      ]
                    }
                  }
                }
              }
            }
          </script>
     `;
     const res = await adapter(html);
     expect(res.imoveis.length).toBe(1);
     expect(res.imoveis[0].imagens[0]).toBe('http://img.com/1.jpg');
  });

  it('should return empty if no NEXT_DATA', async () => {
    const res = await adapter('<html></html>');
    expect(res.imoveis.length).toBe(0);
    expect(res.qtd).toBe(0);
  });
});
