import { adapter } from '../src/sites/locallizegoldimob';

describe('Locallize Gold Imob Scraper', () => {
  it('should parse nothing if no valid json', async () => {
    const result = await adapter('<html></html>');
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toEqual(0);
  });

  it('should parse nothing if json has no data', async () => {
    const result = await adapter('<html><script id="__NEXT_DATA__" type="application/json">{}</script></html>');
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toEqual(0);
  });

  it('should parse properties correctly', async () => {
    const json = {
      props: {
        pageProps: {
            initialState: {
              result: {
                pagination: { total: 10 },
                propertys: [
                  {
                    namTitle: 'Casa linda',
                    valSales: 500000,
                    namDistrict: 'Centro',
                    namCity: 'Franca',
                    namCategory: 'Casa',
                    idtProperty: '123',
                    jsonPhotos: '[{"url":"http://img.com/1.jpg"}]',
                    txtDescription: 'A nice house',
                    numUsefulArea: 100,
                    numTotalArea: 150,
                    numBedrooms: 3,
                    numBathrooms: 2,
                    numGarage: 2
                  },
                  {
                    title: 'Terreno',
                    sale_value: 0,
                    district: 'Centro',
                    city: 'Franca',
                    category: 'Lote',
                    code: '456',
                    photos: []
                  },
                  {
                    valSales: 300000
                  }
                ]
              }
            }
        }
      }
    };
    const html = `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(json)}</script></html>`;
    const result = await adapter(html);
    expect(result.qtd).toEqual(10);
    expect(result.imoveis.length).toEqual(1);
    expect(result.imoveis[0].titulo).toEqual('Casa linda');
    expect(result.imoveis[0].valor).toEqual(500000);
    expect(result.imoveis[0].link).toEqual('https://locallizegoldimob.com.br/imovel/venda/casa/franca/centro/123');
  });
});
