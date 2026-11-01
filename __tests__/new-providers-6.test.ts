import axios from 'axios';
import vale from '../src/sites/imobiliariavale';
import { parseSimob } from '../src/sites/platforms/simob';
import { sites } from '../src/sites';

jest.mock('axios');
const post = axios.post as jest.Mock;
const get = axios.get as jest.Mock;

const tenant = { result: { urlApi: 'https://x.simob.com.br', tokenIntegracao: 'tok' } };
const listed = (over: Record<string, unknown> = {}) => ({
  codigo: '10023', bairro: 'CIDADE NOVA', cidade: 'FRANCA', descricaoCategoria: 'Apartamento', valor: '1800000.00',
  descricaoImovel: '<div>Vende-se <b>apto</b></div>',
  caracteristicas: [{ descricao: 'Dormitório(s)', valor: '3' }, { descricao: 'Banheiro(s)', valor: '5' }],
  ...over,
});
const detail = { imagens: [{ url: '/cdn/a.png?x=1' }, {}], caracteristicas: [{ descricao: 'Vagas de garagem', valor: '3' }, { descricao: 'Área da unidade - m²  ', valor: '159.00' }, { descricao: 'Área do terreno', valor: '300' }] };

describe('platforms/simob (imobiliariavale.com.br)', () => {
  beforeEach(() => { post.mockReset(); get.mockReset(); });

  it('le a listagem, completa com o detalhe (fotos, area, vagas) e monta o link do site', async () => {
    post.mockResolvedValue({ data: { result: [listed()] } });
    get.mockResolvedValue({ data: { result: [detail] } });
    const { imoveis, qtd } = await parseSimob(tenant, 'imobiliariavale.com.br', 'imobiliariavale.com.br - Comprar', 'venda');
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({
      valor: 1800000, area: 159, areaTotal: 300, quartos: 3, banheiros: 5, vagas: 3, codigo: '10023', tipoImovel: 'apartamento',
      titulo: 'Apartamento - CIDADE NOVA', endereco: 'CIDADE NOVA', descricao: 'Vende-se apto',
      link: 'https://imobiliariavale.com.br/imovel/exibir/venda-apartamento-cidade-nova-franca/10023',
      imagens: ['https://cdnmidia.simob.com.br/cdn/a.png?x=1'],
    });
    expect(post.mock.calls[0][2].headers).toMatchObject({ Authorization: 'Bearer tok', From: 'site' });
    expect(JSON.parse(post.mock.calls[0][1].data).finalidade).toBe(2);
  });

  it('aluguel usa finalidade 1 e o prefixo locacao no link; aceita resultado em objeto e payload string', async () => {
    post.mockResolvedValue({ data: { result: { 0: listed({ descricaoCategoria: 'Casa' }) } } });
    get.mockResolvedValue({ data: { result: [] } });
    const { imoveis } = await parseSimob(JSON.stringify(tenant), 'imobiliariavale.com.br', 'imobiliariavale.com.br - Alugar', 'aluguel');
    expect(JSON.parse(post.mock.calls[0][1].data).finalidade).toBe(1);
    expect(imoveis[0].link).toBe('https://imobiliariavale.com.br/imovel/exibir/locacao-casa-cidade-nova-franca/10023');
    expect(imoveis[0].imagens).toEqual([]);
  });

  it('descarta outras cidades, sem preco e sem codigo; falha no detalhe mantem o anuncio', async () => {
    post.mockResolvedValue({ data: { result: [listed({ cidade: 'RIFAINA' }), listed({ valor: '0' }), listed({ codigo: '' }), listed({ codigo: '77' })] } });
    get.mockRejectedValue(new Error('boom'));
    const { imoveis } = await parseSimob(tenant, 'h.com.br', 'h - Comprar', 'venda');
    expect(imoveis.map(i => i.codigo)).toEqual(['77']);
    expect(imoveis[0].imagens).toEqual([]);
  });

  it('sem tenant (params invalido) retorna vazio sem chamar a API; area so do terreno vale como total', async () => {
    expect((await parseSimob({}, 'h.com.br', 'h', 'venda')).imoveis).toEqual([]);
    expect(post).not.toHaveBeenCalled();
    post.mockResolvedValue({ data: {} });
    expect((await parseSimob(tenant, 'h.com.br', 'h', 'venda')).imoveis).toEqual([]);
    post.mockResolvedValue({ data: { result: [listed({ caracteristicas: undefined, descricaoImovel: undefined, bairro: undefined })] } });
    get.mockResolvedValue({ data: { result: [{ caracteristicas: [{ descricao: 'Área do terreno', valor: '300' }] }] } });
    const { imoveis } = await parseSimob(tenant, 'h.com.br', 'h', 'venda');
    expect(imoveis[0]).toMatchObject({ area: 300, areaTotal: 300, precoPorMetro: 6000, quartos: 0, titulo: 'Apartamento' });
  });

  it('registra venda e aluguel apontando para o params do tenant', async () => {
    const [venda, aluguel] = vale;
    expect([venda.name, aluguel.name]).toEqual(['imobiliariavale.com.br - Comprar', 'imobiliariavale.com.br - Alugar']);
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://simob.com.br/v2/imobiliaria/site/params?host=imobiliariavale.com.br' });
    post.mockResolvedValue({ data: { result: [listed()] } });
    get.mockResolvedValue({ data: { result: [detail] } });
    const out = await aluguel.adapter(JSON.stringify(tenant)) as unknown as { imoveis: Array<{ site: string }> };
    expect(out.imoveis[0].site).toBe('imobiliariavale.com.br - Alugar');
    const names = sites.map(s => s.name);
    vale.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
  });
});
