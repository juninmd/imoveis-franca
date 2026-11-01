import pucci, { adapter } from '../src/sites/pucciimobiliaria';

const item = (over: any = {}) => ({
  codigo: 1097,
  titulo: 'residencia-a-venda-bairro-vila-santa-rita--franca-sp',
  tipo: 'Casa',
  valor: 'R$ 480.000,00',
  bairro: 'Vila Santa Rita',
  cidade: 'Franca',
  endereco: 'Rua Nossa Senhora de Fátima',
  numeroquartos: '3',
  numerobanhos: '1',
  numerovagas: '2',
  areainterna: '100,00',
  arealote: '252,00',
  tipomedida: 'm²',
  urlfotoprincipalp: 'https://cdn.imoview.com.br/pucci/1.jpg',
  fotos: [{ urlp: 'https://cdn.imoview.com.br/pucci/1.jpg' }, { urlp: 'https://cdn.imoview.com.br/pucci/2.jpg' }],
  ...over,
});

describe('pucciimobiliaria', () => {
  it('should request the Franca ajax endpoint with pagination', () => {
    expect(pucci.url).toBe('https://www.pucciimobiliaria.com.br/imoveis/ajax/');
    expect(pucci.method).toBe('POST');
    const imovel = pucci.getPaginateParams(3).payload.imovel;
    expect(imovel).toMatchObject({ finalidade: 'venda', codigocidade: 2, numeropagina: 3, pagina: 3, numeroregistros: 20 });
  });

  it('should parse the JSON listing', async () => {
    const json = JSON.stringify({ quantidade: 84, lista: [item(), item({ codigo: 2, valor: 'R$ 0,00' })] });
    const { imoveis, qtd } = await adapter(json);
    expect(qtd).toBe(84);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({
      valor: 480000,
      area: 100,
      areaTotal: 252,
      quartos: 3,
      banheiros: 1,
      vagas: 2,
      link: 'https://www.pucciimobiliaria.com.br/imovel/residencia-a-venda-bairro-vila-santa-rita--franca-sp/1097',
      site: 'pucciimobiliaria.com.br',
    });
    expect(imoveis[0].imagens).toHaveLength(2);
  });

  it('should tolerate PHP warnings before the JSON and invalid content', async () => {
    const body = JSON.stringify({ quantidade: 1, lista: [item()] });
    expect((await adapter(`<b>Warning</b>: x\n${body}`)).imoveis).toHaveLength(1);
    expect((await adapter('<br /><b>Fatal error</b>')).imoveis).toHaveLength(0);
  });
});
