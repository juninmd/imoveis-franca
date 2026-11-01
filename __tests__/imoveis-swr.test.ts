import axios from 'axios';
import { filterImoveis, generateList, retrieImoveisSiteByParams } from '../src/imoveis';
import RedisConnection from '../src/infra/redis';
import { Imoveis, Site } from '../src/types';
import { sites } from '../src/sites';

jest.mock('axios');
jest.mock('p-limit', () => ({ __esModule: true, default: () => (fn) => fn() }));
jest.mock('../src/infra/redis', () => {
  const impl = { getKey: jest.fn(), setKey: jest.fn() };
  return { __esModule: true, default: impl, RedisConnection: impl };
});
jest.mock('../src/sites', () => ({
  sites: [{
    name: 'SwrSite',
    url: 'http://swr.test',
    driver: 'axios',
    enabled: true,
    itemsPerPage: 10,
    params: [],
    adapter: jest.fn(),
    getPaginateParams: () => ({}),
  }],
}));

const getKey = RedisConnection.getKey as jest.Mock;
const setKey = RedisConnection.setKey as jest.Mock;
const adapter = sites[0].adapter as jest.Mock;

const base: Imoveis = {
  site: 'SwrSite', titulo: 'Casa no Centro', descricao: 'Ótima localização', imagens: [], endereco: 'CENTRO',
  valor: 100000, area: 50, areaTotal: 50, quartos: 2, link: 'http://swr.test/1', banheiros: 1, vagas: 1,
  precoPorMetro: 2000, entrada: 20000,
};
const stale = { v: 1, freshUntil: Date.now() - 1000, data: [{ ...base, titulo: 'Antigo' }] };
const settle = () => new Promise(resolve => setImmediate(resolve));

describe('generateList: stale-while-revalidate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (axios.get as jest.Mock).mockResolvedValue({ data: '<html></html>' });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('serve o cache vencido na hora e revalida por tras', async () => {
    getKey.mockResolvedValue(stale);
    adapter.mockResolvedValue({ imoveis: [{ ...base, titulo: 'Novo' }], qtd: 1 });

    const result = await generateList({});
    expect(result.map(r => r.titulo)).toEqual(['Antigo']);

    await settle();
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(setKey).toHaveBeenCalledTimes(1);
    expect(setKey.mock.calls[0][1].data[0].titulo).toBe('Novo');
  });

  it('nao raspa quando o cache esta fresco', async () => {
    getKey.mockResolvedValue({ ...stale, freshUntil: Date.now() + 60_000 });
    await generateList({});
    expect(adapter).not.toHaveBeenCalled();
  });

  it('mantem os dados antigos quando o site volta vazio na revalidacao (site fora do ar)', async () => {
    getKey.mockResolvedValue(stale);
    adapter.mockResolvedValue({ imoveis: [], qtd: 0 });

    await generateList({});
    await settle();

    expect(setKey).toHaveBeenCalledTimes(1);
    const [, envelope, ttl] = setKey.mock.calls[0];
    expect(envelope.data[0].titulo).toBe('Antigo');
    expect(ttl).toBeGreaterThan(80_000);
  });

  it('scraping parcial (poucos anuncios frente ao cache) nao sobrescreve o ultimo resultado bom', async () => {
    const many = Array.from({ length: 10 }, (_v, i) => ({ ...base, titulo: `Antigo ${i}`, link: `http://swr.test/${i}` }));
    getKey.mockResolvedValue({ ...stale, data: many });
    adapter.mockResolvedValue({ imoveis: [{ ...base, titulo: 'So um' }], qtd: 1 });

    const result = await generateList({});
    await settle();

    expect(result).toHaveLength(10);
    expect(setKey.mock.calls[0][1].data).toHaveLength(10);
  });

  it('grava o resultado novo quando ele e pelo menos metade do anterior', async () => {
    const four = Array.from({ length: 4 }, (_v, i) => ({ ...base, link: `http://swr.test/${i}` }));
    getKey.mockResolvedValue({ ...stale, data: four });
    adapter.mockResolvedValue({ imoveis: [{ ...base, titulo: 'a', link: 'x1' }, { ...base, titulo: 'b', link: 'x2' }], qtd: 2 });

    await generateList({});
    await settle();

    expect(setKey.mock.calls[0][1].data.map(i => i.titulo)).toEqual(['a', 'b']);
  });

  it('janela stale esgotada: o site morto deixa de ser servido e grava cache negativo', async () => {
    getKey.mockResolvedValue({ ...stale, lastGoodAt: Date.now() - 2 * 24 * 3600 * 1000 });
    adapter.mockResolvedValue({ imoveis: [], qtd: 0 });

    await generateList({});
    await settle();

    expect(setKey.mock.calls[0][1].data).toEqual([]);
    expect(setKey.mock.calls[0][2]).toBeLessThanOrEqual(330);
  });

  it('preenche tipoImovel pelo titulo quando o adapter nao informa', async () => {
    getKey.mockResolvedValue(null);
    adapter.mockResolvedValue({ imoveis: [{ ...base, titulo: 'Terreno plano', tipoImovel: undefined }, { ...base, titulo: 'X', link: 'k2', tipoImovel: 'rural' }, { ...base, titulo: 'Coisa', link: 'k3' }], qtd: 3 });

    const result = await generateList({});
    const byTitle = Object.fromEntries(result.map(r => [r.titulo, r.tipoImovel]));
    expect(byTitle).toEqual({ 'Terreno plano': 'terreno', X: 'rural', Coisa: undefined });
  });

  it('cache frio e site vazio grava cache negativo curto', async () => {
    getKey.mockResolvedValue(null);
    adapter.mockResolvedValue({ imoveis: [], qtd: 0 });

    expect(await generateList({})).toEqual([]);
    expect(setKey.mock.calls[0][1].data).toEqual([]);
    expect(setKey.mock.calls[0][2]).toBeLessThanOrEqual(330);
  });

  it('falha ao gravar na revalidacao e logada e nao derruba a resposta', async () => {
    getKey.mockResolvedValue(stale);
    adapter.mockResolvedValue({ imoveis: [{ ...base, titulo: 'Novo' }], qtd: 1 });
    setKey.mockRejectedValueOnce(new Error('redis caiu'));

    const result = await generateList({});
    await settle();

    expect(result).toHaveLength(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Falha ao revalidar SwrSite: redis caiu'));
  });
});

describe('maxPages por site', () => {
  it('limita as paginas de portais enormes', async () => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const portal = { ...sites[0], itemsPerPage: 10, maxPages: 3 } as unknown as Site;
    adapter.mockReset();
    adapter.mockResolvedValue({ imoveis: [], qtd: 5000 });

    await retrieImoveisSiteByParams(portal, undefined, { minPrice: 0, maxPrice: 1, quartos: 1, minArea: 0, maxArea: 1 });
    expect(adapter).toHaveBeenCalledTimes(3);
  });
});

describe('filterImoveis: tipoImovel e busca textual', () => {
  const list: Imoveis[] = [
    { ...base, titulo: 'Casa no Jardim Aeroporto', tipoImovel: 'casa', codigo: 'CA01' },
    { ...base, titulo: 'Apartamento Cobertura', tipoImovel: 'apartamento', endereco: 'CENTRO', link: 'a' },
    { ...base, titulo: 'Anúncio sem tipo', link: 'b' },
  ];

  it('filtra por tipo de imovel e preserva anuncios sem tipo conhecido', () => {
    const result = filterImoveis(list, { tipoImovel: ['apartamento'] });
    expect(result.map(r => r.titulo)).toEqual(['Apartamento Cobertura', 'Anúncio sem tipo']);
  });

  it('lista vazia de tipos nao filtra nada', () => {
    expect(filterImoveis(list, { tipoImovel: [] })).toHaveLength(3);
  });

  it('busca texto ignorando acentos e caixa, inclusive no codigo', () => {
    expect(filterImoveis(list, { q: 'ANUNCIO' }).map(r => r.titulo)).toEqual(['Anúncio sem tipo']);
    expect(filterImoveis(list, { q: 'ca01' })).toHaveLength(1);
    expect(filterImoveis(list, { q: 'nada disso' })).toHaveLength(0);
  });
});
