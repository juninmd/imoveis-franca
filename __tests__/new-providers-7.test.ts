import mudare from '../src/sites/mudare';
import { parseImoview } from '../src/sites/platforms/imoview';
import { sites } from '../src/sites';

const item = (over: Record<string, unknown> = {}) => ({
  codigo: 943, codigoauxiliar: 'CA753', tipo: 'Casa', valor: 'R$ 490.000,00', bairro: 'Residencial Irineu Zanetti', cidade: 'Franca',
  titulo: 'Casa 100m² à Venda', numeroquartos: '3', numerobanhos: '1', numerovagas: '2', areaprincipal: '100,00', arealote: '125,00',
  urlfotoprincipalp: 'https://cdn/capa.jpg', url_amigavel: 'casa-100m-a-venda', fotos: [{ urlp: 'https://cdn/1.jpg' }, {}, { urlp: 'https://cdn/2.jpg' }],
  ...over,
});

describe('platforms/imoview (mudare.imb.br)', () => {
  it('le preco, areas, comodos, todas as fotos, codigo e o link do site', async () => {
    const { imoveis, qtd } = await parseImoview({ quantidade: 91, lista: [item()] }, 'www.mudare.imb.br', 'mudare.imb.br - Comprar');
    expect(qtd).toBe(91);
    expect(imoveis[0]).toMatchObject({
      valor: 490000, area: 100, areaTotal: 125, quartos: 3, banheiros: 1, vagas: 2, codigo: 'CA753', tipoImovel: 'casa',
      titulo: 'Casa - Residencial Irineu Zanetti', descricao: 'Casa 100m² à Venda', endereco: 'RESIDENCIAL IRINEU ZANETTI',
      link: 'https://www.mudare.imb.br/imovel/casa-100m-a-venda/943', imagens: ['https://cdn/1.jpg', 'https://cdn/2.jpg'],
    });
  });

  it('descarta outras cidades, sem preco e sem url; usa foto de capa, codigo numerico e aceita payload string', async () => {
    const lista = [item({ cidade: 'Rifaina' }), item({ valor: 'R$ 0,00' }), item({ url_amigavel: '' }), item({ fotos: undefined, codigoauxiliar: '', areaprincipal: '', numeroquartos: undefined, tipo: undefined, bairro: undefined })];
    const { imoveis } = await parseImoview(JSON.stringify({ lista }), 'h.com.br', 'h - Comprar');
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ imagens: ['https://cdn/capa.jpg'], codigo: '943', area: 125, areaTotal: 125, quartos: 0, titulo: '' });
  });

  it('sem lista nem foto devolve vazio e usa a contagem de itens como total', async () => {
    expect(await parseImoview({}, 'h.com.br', 'h')).toMatchObject({ imoveis: [], qtd: 0 });
    const { imoveis, qtd } = await parseImoview({ lista: [item({ fotos: [], urlfotoprincipalp: undefined })] }, 'h.com.br', 'h');
    expect(qtd).toBe(1);
    expect(imoveis[0].imagens).toEqual([]);
  });

  it('config: POST de formulario com limite de 20 registros, paginado por numeropagina', () => {
    const [venda, aluguel] = mudare;
    expect([venda.name, aluguel.name]).toEqual(['mudare.imb.br - Comprar', 'mudare.imb.br - Alugar']);
    expect(venda).toMatchObject({ driver: 'axios_rest', method: 'POST', tipo: 'venda', itemsPerPage: 20 });
    expect(aluguel.payload).toMatchObject({ finalidade: 'aluguel', numeroregistros: 20, 'bairros[0][nome]': 'Todos' });
    expect(venda.getPaginateParams(3)).toEqual({ url: 'https://www.mudare.imb.br/retornar-imoveis-disponiveis', payload: { numeropagina: 3 } });
    const body = venda.axiosConfig.transformRequest[0]({ finalidade: 'venda', 'bairros[0][nome]': 'Todos', numeropagina: 2 });
    expect(body).toBe('finalidade=venda&bairros%5B0%5D%5Bnome%5D=Todos&numeropagina=2');
    const names = sites.map(s => s.name);
    mudare.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
  });

  it('o adapter registrado usa o nome do proprio site', async () => {
    const out = await mudare[1].adapter({ lista: [item()] } as never);
    expect(out.imoveis[0].site).toBe('mudare.imb.br - Alugar');
  });
});
