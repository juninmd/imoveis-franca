import { retrieImoveisSite } from '../src/imoveis';
import { buildPortalSites } from '../src/sites/platforms/portal';
import { Site } from '../src/types';
import axios from 'axios';
import browser from '../src/infra/browser';

jest.mock('axios');
// p-limit e ESM: sem este mock o import default nao e funcao no ts-jest e o fluxo com mais de uma pagina lanca.
jest.mock('p-limit', () => ({ __esModule: true, default: () => (fn: () => unknown) => fn() }));
jest.mock('../src/infra/browser', () => ({ __esModule: true, default: { recycle: jest.fn(), getNewPage: jest.fn() } }));

beforeAll(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => jest.restoreAllMocks());

const bandSite = (adapter: Site['adapter']): Site => ({
  name: 'BandSite', driver: 'axios', enabled: true, url: 'http://bands.example.com/lista', itemsPerPage: 10,
  params: [{ precoMaximo: 100 }, { precoMinimo: 100, precoMaximo: 200 }], appendParams: true,
  getPaginateParams: (page: number) => ({ url: `http://bands.example.com/lista?pagina=${page}` }),
  adapter,
} as unknown as Site);

describe('faixas de preco (appendParams)', () => {
  beforeEach(() => { (axios.get as jest.Mock).mockReset().mockResolvedValue({ data: 'html' }); });

  it('anexa cada faixa na URL de paginacao, respeitando o "?" que ja existe', async () => {
    const site = bandSite(async () => ({ imoveis: [{ titulo: 'x', link: 'l' } as never], qtd: 1 }));
    await retrieImoveisSite(site, {} as never);
    const urls = (axios.get as jest.Mock).mock.calls.map(c => c[0]);
    expect(urls).toEqual(['http://bands.example.com/lista?pagina=1&precoMaximo=100', 'http://bands.example.com/lista?pagina=1&precoMinimo=100&precoMaximo=200']);
  });

  it('usa "?" quando a URL de paginacao nao tem query', async () => {
    const site = { ...bandSite(async () => ({ imoveis: [{ titulo: 'x' } as never], qtd: 1 })), getPaginateParams: () => ({ url: 'http://bands.example.com/lista' }) } as Site;
    await retrieImoveisSite(site, {} as never);
    expect((axios.get as jest.Mock).mock.calls[0][0]).toBe('http://bands.example.com/lista?precoMaximo=100');
  });

  it('primeira pagina vazia (antibot) ganha novas tentativas com pausa e depois segue', async () => {
    jest.useFakeTimers();
    let calls = 0;
    const site = { ...bandSite(async () => (++calls < 3 ? { imoveis: [], qtd: 0 } : { imoveis: [{ titulo: 'ok' } as never], qtd: 1 })), params: [{ precoMaximo: 100 }] } as Site;
    const pending = retrieImoveisSite(site, {} as never);
    await jest.advanceTimersByTimeAsync(3000);
    await jest.advanceTimersByTimeAsync(6000);
    const result = await pending;
    jest.useRealTimers();
    expect(calls).toBe(3);
    expect(result.map(r => r.titulo)).toEqual(['ok']);
  });

  it('em portal com navegador, recicla o Chromium antes de cada nova tentativa', async () => {
    jest.useFakeTimers();
    const recycle = browser.recycle as jest.Mock;
    recycle.mockClear();
    const page = { goto: jest.fn(), content: jest.fn().mockResolvedValue('html'), close: jest.fn(), setDefaultNavigationTimeout: jest.fn(), waitForSelector: jest.fn() };
    (browser.getNewPage as jest.Mock).mockResolvedValue(page);
    const site = { ...bandSite(async () => ({ imoveis: [], qtd: 0 })), driver: 'puppet', params: [{ precoMaximo: 100 }] } as Site;
    const pending = retrieImoveisSite(site, {} as never);
    await jest.advanceTimersByTimeAsync(20000);
    await pending;
    jest.useRealTimers();
    expect(recycle).toHaveBeenCalledTimes(2);
  });

  it('desiste depois das tentativas e sites sem faixa nao repetem a primeira pagina', async () => {
    jest.useFakeTimers();
    let calls = 0;
    const empty = async () => { calls++; return { imoveis: [], qtd: 0 }; };
    const pending = retrieImoveisSite({ ...bandSite(empty), params: [{ precoMaximo: 100 }] } as Site, {} as never);
    await jest.advanceTimersByTimeAsync(20000);
    expect(await pending).toEqual([]);
    expect(calls).toBe(3);
    jest.useRealTimers();

    calls = 0;
    await retrieImoveisSite({ ...bandSite(empty), params: [{ precoMaximo: 100 }], appendParams: false } as Site, {} as never);
    expect(calls).toBe(1);
  });
});

describe('buildPortalSites com faixas', () => {
  const config = {
    host: 'https://p.example.com', label: 'p.example.com', pageSize: 10, maxPages: 5, driver: 'axios' as const,
    parser: async () => ({ imoveis: [], qtd: 0, html: '' }), firstPageUrl: () => 'https://p.example.com/', pageUrl: (_t: unknown, page: number) => `https://p.example.com/?pagina=${page}`,
  };

  it('so a finalidade com faixas recebe params e appendParams', () => {
    const [venda, aluguel] = buildPortalSites({ ...config, bands: tipo => (tipo === 'venda' ? [{ precoMaximo: 1 }] : undefined) });
    expect(venda).toMatchObject({ params: [{ precoMaximo: 1 }], appendParams: true });
    expect(aluguel).toMatchObject({ params: [], appendParams: false });
  });
});

describe('listagens por variante (tipo de imovel)', () => {
  const config = {
    host: 'https://p.example.com', label: 'p.example.com', pageSize: 10, maxPages: 5, driver: 'axios' as const,
    parser: async () => ({ imoveis: [], qtd: 0, html: '' }), firstPageUrl: () => 'https://p.example.com/todos.html', pageUrl: (_t: unknown, page: number) => `https://p.example.com/todos-${page}.html`,
    variants: (tipo: string) => (tipo === 'venda' ? [{ type: 'casas' }, { type: 'terrenos' }] : undefined),
    variantPageUrl: (_t: unknown, page: number, { type }: Record<string, string>) => `https://p.example.com/${type}${page > 1 ? `-${page}` : ''}.html`,
  };

  it('a finalidade com variantes recebe params; a URL vem da variante, sem anexar query', () => {
    const [venda, aluguel] = buildPortalSites(config);
    expect(venda.params).toEqual([{ type: 'casas' }, { type: 'terrenos' }]);
    expect(venda.appendParams).toBe(false);
    expect(venda.getPaginateParams(1, { type: 'casas' }).url).toBe('https://p.example.com/casas.html');
    expect(venda.getPaginateParams(3, { type: 'terrenos' }).url).toBe('https://p.example.com/terrenos-3.html');
    expect(venda.getPaginateParams(2).url).toBe('https://p.example.com/todos-2.html');
    expect(aluguel.params).toEqual([]);
  });

  it('o pipeline entrega a variante da vez ao getPaginateParams e varre cada uma', async () => {
    (axios.get as jest.Mock).mockReset().mockResolvedValue({ data: 'html' });
    const [venda] = buildPortalSites({ ...config, parser: async () => ({ imoveis: [{ titulo: 'x' } as never], qtd: 1, html: '' }) });
    await retrieImoveisSite(venda, {} as never);
    expect((axios.get as jest.Mock).mock.calls.map(c => c[0])).toEqual(['https://p.example.com/casas.html', 'https://p.example.com/terrenos.html']);
  });
});

describe('site sem "params" declarado', () => {
  // `params` e opcional no tipo; antes, ausente significava "nao buscar" e o site nunca era consultado.
  it('faz a busca unica em vez de pular o site em silencio', async () => {
    (axios.get as jest.Mock).mockReset().mockResolvedValue({ data: 'html' });
    const site = { ...bandSite(async () => ({ imoveis: [{ titulo: 'x', link: 'l' } as never], qtd: 1 })), params: undefined, appendParams: false } as unknown as Site;
    const result = await retrieImoveisSite(site, {} as never);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
  });
});

describe('URL completa vinda do getPaginateParams', () => {
  // O pipeline anexava a query na URL e o axios_rest a repetia via `params`: o servidor respondia 500.
  it('nao repassa params ao axios_rest, so a URL ja montada', async () => {
    (axios.request as jest.Mock).mockReset().mockResolvedValue({ data: { ok: true } });
    const site = {
      ...bandSite(async () => ({ imoveis: [{ titulo: 'x', link: 'l' } as never], qtd: 1 })),
      driver: 'axios_rest', method: 'GET', appendParams: false, params: [{ sort: 'recent' }],
      getPaginateParams: (_page: number, variant?: { sort: string }) => ({ url: `http://bands.example.com/api?sort=${variant?.sort}` }),
    } as unknown as Site;
    await retrieImoveisSite(site, {} as never);
    const call = (axios.request as jest.Mock).mock.calls[0][0];
    expect(call.url).toBe('http://bands.example.com/api?sort=recent');
    expect(call.params).toBeUndefined();
  });
});

describe('paginacao so por paginateParams.params (site sem "params")', () => {
  // Com params vazio, requestParams era undefined e o params de paginacao era descartado: so a pagina 1 era lida.
  it('anexa a pagina na URL de cada requisicao', async () => {
    (axios.get as jest.Mock).mockReset().mockResolvedValue({ data: 'html' });
    const site = {
      ...bandSite(async () => ({ imoveis: [{ titulo: 'x', link: 'l' } as never], qtd: 20 })),
      url: 'http://bands.example.com/lista', params: [], appendParams: false, itemsPerPage: 10,
      getPaginateParams: (page: number) => ({ params: { pagina: page } }),
    } as unknown as Site;
    await retrieImoveisSite(site, {} as never);
    const urls = (axios.get as jest.Mock).mock.calls.map(c => c[0]);
    expect(urls).toEqual(['http://bands.example.com/lista?pagina=1', 'http://bands.example.com/lista?pagina=2']);
  });
});
