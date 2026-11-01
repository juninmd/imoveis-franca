import site, { adapter } from '../src/sites/realizacca';

describe('realizacca (MSysImob API)', () => {
  const doc = {
    idtProperty: 3559,
    jsonPhotos: '[{"desPhoto":"Foto","urlPhoto":"https://s3.amazonaws.com/x/1.jpg","flgNotShowSite":0},{"urlPhoto":"https://s3.amazonaws.com/x/2.jpg","flgNotShowSite":1}]',
    namStreet: 'Rua A',
    namDistrict: 'Jardim Dr. Antônio Petraglia',
    namCity: 'Franca',
    namCategory: 'Casas',
    prop_char_1: 120,
    prop_char_2: 185.08,
    prop_char_5: 3,
    prop_char_12: 2,
    prop_char_176: 2,
    valSales: 590000,
    desTitleSite: 'Casa Padrão à Venda no Jardim Petraglia, Franca',
    indType: 'S',
  };

  it('usa a API de consulta com paginacao por start', () => {
    expect(site.driver).toBe('axios_rest');
    expect(site.method).toBe('POST');
    expect(site.url).toBe('https://realizacca.com.br/api/service/consult');
    expect(site.payload.idtCityList).toEqual([36]);
    expect(site.getPaginateParams(1)).toEqual({ payload: { start: 0, numRows: 12 } });
    expect(site.getPaginateParams(3)).toEqual({ payload: { start: 24, numRows: 12 } });
  });

  it('retorna vazio para conteudo invalido', async () => {
    expect((await adapter('<html></html>')).imoveis).toEqual([]);
    expect(await adapter({})).toMatchObject({ imoveis: [], qtd: 0 });
    expect((await adapter(null)).qtd).toBe(0);
  });

  it('mapeia os imoveis da resposta', async () => {
    const result = await adapter({
      response: {
        numFound: 30,
        docs: [
          doc,
          { ...doc, idtProperty: 7, indType: 'SL', namCategory: 'Apartamentos', namDistrict: 'Centro', namStreet: undefined, prop_char_1: undefined },
          { ...doc, idtProperty: 8, valSales: 0 },
          { ...doc, idtProperty: undefined },
        ],
      },
    });
    expect(result.qtd).toBe(30);
    expect(result.imoveis).toHaveLength(2);
    const [a, b] = result.imoveis;
    expect(a).toMatchObject({
      valor: 590000,
      area: 120,
      areaTotal: 185.08,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      link: 'https://realizacca.com.br/imovel/venda/casas/franca/jardim-dr-antonio-petraglia/3559',
      site: 'realizacca.com.br',
      titulo: 'Casa Padrão à Venda no Jardim Petraglia, Franca',
    });
    expect(a.imagens).toEqual(['https://s3.amazonaws.com/x/1.jpg']);
    expect(a.endereco).toContain('Rua A');
    expect(a.precoPorMetro).toBeCloseTo(590000 / 120);
    expect(b.link).toBe('https://realizacca.com.br/imovel/venda-e-locacao/apartamentos/franca/centro/7');
    expect(b.area).toBe(185.08);
  });

  it('aceita o JSON como string', async () => {
    const result = await adapter(JSON.stringify({ response: { numFound: 1, docs: [doc] } }));
    expect(result.imoveis).toHaveLength(1);
  });
});
