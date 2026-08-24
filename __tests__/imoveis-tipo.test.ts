import { getImoveis, filterImoveis } from '../src/imoveis';
import { Imoveis, Site } from '../src/types';
import axios from 'axios';

jest.mock('axios');

beforeAll(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

const baseSite = {
  driver: 'axios',
  enabled: true,
  url: 'http://test.com',
  itemsPerPage: 10,
  getPaginateParams: () => ({ params: {} }),
} as unknown as Site;

describe('tipo propagation (Site -> Imovel)', () => {
  beforeEach(() => {
    (axios.get as jest.Mock).mockResolvedValue({ data: '<html></html>' });
  });

  it('assigns the site.tipo to every imovel when the adapter does not set one', async () => {
    const site = {
      ...baseSite,
      name: 'AluguelSite',
      tipo: 'aluguel',
      adapter: async () => ({ imoveis: [{ titulo: 'A' } as Imoveis], qtd: 1 }),
    } as Site;

    const { imoveis } = await getImoveis(site, undefined, {} as any, 1);
    expect(imoveis[0].tipo).toBe('aluguel');
  });

  it('falls back to "ambos" when the site has no tipo defined', async () => {
    const site = {
      ...baseSite,
      name: 'NoTipoSite',
      adapter: async () => ({ imoveis: [{ titulo: 'B' } as Imoveis], qtd: 1 }),
    } as Site;

    const { imoveis } = await getImoveis(site, undefined, {} as any, 1);
    expect(imoveis[0].tipo).toBe('ambos');
  });

  it('respects a tipo already set by the adapter (per-listing inference)', async () => {
    const site = {
      ...baseSite,
      name: 'MixedSite',
      tipo: 'venda',
      adapter: async () => ({ imoveis: [{ titulo: 'C', tipo: 'aluguel' } as Imoveis], qtd: 1 }),
    } as Site;

    const { imoveis } = await getImoveis(site, undefined, {} as any, 1);
    expect(imoveis[0].tipo).toBe('aluguel');
  });

  it('does not crash when the adapter returns null imoveis', async () => {
    const site = {
      ...baseSite,
      name: 'NullSite',
      tipo: 'venda',
      adapter: async () => ({ imoveis: null as any, qtd: 0 }),
    } as Site;

    const { imoveis } = await getImoveis(site, undefined, {} as any, 1);
    expect(imoveis).toEqual([]);
  });
});

describe('filterImoveis by tipo', () => {
  const mockImovel: Imoveis = {
    titulo: 'Teste', valor: 100000, area: 100, areaTotal: 200, quartos: 3, banheiros: 2,
    vagas: 2, endereco: 'CENTRO', link: 'http://test.com', precoPorMetro: 1000, imagens: [],
    site: 'TestSite', descricao: '', entrada: 0,
  };

  it('returns everything when tipo is not provided', () => {
    const list = [{ ...mockImovel, tipo: 'venda' as const }, { ...mockImovel, tipo: 'aluguel' as const }];
    expect(filterImoveis(list, {})).toHaveLength(2);
  });

  it('filters out aluguel when tipo=venda', () => {
    const list = [{ ...mockImovel, tipo: 'venda' as const }, { ...mockImovel, tipo: 'aluguel' as const }];
    expect(filterImoveis(list, { tipo: 'venda' })).toHaveLength(1);
  });

  it('filters out venda when tipo=aluguel', () => {
    const list = [{ ...mockImovel, tipo: 'venda' as const }, { ...mockImovel, tipo: 'aluguel' as const }];
    const result = filterImoveis(list, { tipo: 'aluguel' });
    expect(result).toHaveLength(1);
    expect(result[0].tipo).toBe('aluguel');
  });

  it('keeps "ambos" imoveis in both filters', () => {
    const list = [{ ...mockImovel, tipo: 'ambos' as const }];
    expect(filterImoveis(list, { tipo: 'venda' })).toHaveLength(1);
    expect(filterImoveis(list, { tipo: 'aluguel' })).toHaveLength(1);
  });
});
