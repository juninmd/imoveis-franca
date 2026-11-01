import colibex from '../src/sites/colibexsites';
import { parseColibex } from '../src/sites/platforms/colibex';
import { sites } from '../src/sites';

const item = (over: Record<string, unknown> = {}) => ({
  id: '238208073', categoria_nome: 'Apartamento', cidade: 'FRANCA, SP', bairro: 'JARDIM AEROPORTO III', preco_principal_txt: 'R$ 108.444,81',
  area_m2: '88,80', quartos_txt: '2', banheiros_txt: '1', vagas_txt: '1', referencia_plain: 'IMCX8444411882784SP',
  titulo_plain: 'Oferta da Caixa — Apartamento', descricao_html: '<p>Imóvel <b>desocupado</b></p>', fotos: ['https://c/1.jpg', 'https://c/2.jpg'], foto: 'https://c/capa.jpg',
  ...over,
});

describe('platforms/colibex (sramosimoveis, fcaimoveis)', () => {
  it('le preco, area, comodos, galeria, descricao e o link de detalhe', async () => {
    const { imoveis, qtd } = await parseColibex({ meta: { total: 19 }, items: [item()] }, 'sramosimoveis.com.br', 'sramosimoveis.com.br');
    expect(qtd).toBe(19);
    expect(imoveis[0]).toMatchObject({
      valor: 108444.81, area: 88.8, areaTotal: 88.8, quartos: 2, banheiros: 1, vagas: 1, codigo: 'IMCX8444411882784SP', tipoImovel: 'apartamento',
      titulo: 'Apartamento - JARDIM AEROPORTO III', endereco: 'JARDIM AEROPORTO III', descricao: 'Imóvel desocupado',
      link: 'https://sramosimoveis.com.br/detalhes/238208073.html', imagens: ['https://c/1.jpg', 'https://c/2.jpg'],
    });
  });

  it('aceita fotos em texto, cai na capa e na descricao do titulo; aceita payload string', async () => {
    const lista = [item({ fotos: 'https://c/unica.jpg' }), item({ id: '2', fotos: undefined }), item({ id: '3', fotos: [], foto: undefined, descricao_html: '', referencia_plain: '' })];
    const { imoveis } = await parseColibex(JSON.stringify({ items: lista }), 'h.com.br', 'h');
    expect(imoveis.map(i => i.imagens)).toEqual([['https://c/unica.jpg'], ['https://c/capa.jpg'], []]);
    expect(imoveis[2]).toMatchObject({ descricao: 'Oferta da Caixa — Apartamento', codigo: '3' });
  });

  it('descarta outras cidades, sem preco e sem id; sem items devolve vazio', async () => {
    const { imoveis, qtd } = await parseColibex({ items: [item({ cidade: 'RIFAINA, SP' }), item({ preco_principal_txt: '' }), item({ id: undefined })] }, 'h.com.br', 'h');
    expect(imoveis).toEqual([]);
    expect(qtd).toBe(0);
    expect(await parseColibex({}, 'h.com.br', 'h')).toMatchObject({ imoveis: [], qtd: 0 });
  });

  it('sem area/comodos zera os campos', async () => {
    const { imoveis } = await parseColibex({ items: [item({ area_m2: undefined, quartos_txt: undefined, banheiros_txt: undefined, vagas_txt: undefined, categoria_nome: undefined, bairro: undefined })] }, 'h.com.br', 'h');
    expect(imoveis[0]).toMatchObject({ area: 0, precoPorMetro: 0, quartos: 0, banheiros: 0, vagas: 0, titulo: '' });
  });

  it('config: POST de formulario filtrado por Franca, paginado de 0 em 0 e registrado uma vez', async () => {
    const [sramos, fca] = colibex;
    expect([sramos.name, fca.name]).toEqual(['sramosimoveis.com.br', 'fcaimoveis.com.br']);
    expect(sramos).toMatchObject({ driver: 'axios_rest', method: 'POST', tipo: 'venda', url: 'https://sramosimoveis.com.br/api' });
    expect(fca.payload).toMatchObject({ transacao: 'venda', 'cidade[]': 'FRANCA - SP', uf: 'SP' });
    expect(fca.getPaginateParams(1)).toEqual({ url: 'https://fcaimoveis.com.br/api', payload: { pagina: 0 } });
    expect(fca.getPaginateParams(3).payload).toEqual({ pagina: 2 });
    expect(fca.axiosConfig.transformRequest[0]({ 'cidade[]': 'FRANCA - SP', pagina: 0 })).toBe('cidade%5B%5D=FRANCA+-+SP&pagina=0');
    const names = sites.map(s => s.name);
    colibex.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
    expect((await fca.adapter({ items: [item()] } as never) as unknown as { imoveis: Array<{ site: string }> }).imoveis[0].site).toBe('fcaimoveis.com.br');
  });
});
