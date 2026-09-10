import axios from 'axios';
import { Site } from '../src/types';
import { cacheKeyFor, dedupeImoveis, getImoveis, retrieImoveisSiteByParams, sanitizeImoveis, sortImoveis } from '../src/imoveis';

jest.mock('axios');
// Mesma armadilha do `qs`: o import default de um pacote CJS resolve para undefined sob
// ts-jest, entao o repo inteiro mocka o p-limit nos testes que passam pela paginacao.
jest.mock('p-limit', () => ({ __esModule: true, default: () => (fn: any) => fn() }));
const mockedAxios = axios as unknown as { get: jest.Mock; request: jest.Mock };

const baseQueryParams = { minPrice: 0, maxPrice: 2000000, quartos: 2, minArea: 0, maxArea: 500 };

const adapter = async () => ({ imoveis: [], qtd: 0 });

describe('estado compartilhado entre requisições', () => {
  beforeEach(() => jest.clearAllMocks());

  it('não muta site.payload ao paginar', async () => {
    // O payload é um objeto de módulo compartilhado por todas as requisições e por todas as
    // páginas em voo (pLimit roda 5 em paralelo): mutá-lo fazia páginas concorrentes
    // sobrescreverem o `skip` umas das outras.
    const site = {
      name: 'rest', driver: 'axios_rest', enabled: true, method: 'POST',
      url: 'https://exemplo.test/busca',
      payload: { busca: { cidade: 'Franca' }, skip: 0, limit: 8 },
      itemsPerPage: 8,
      getPaginateParams: (page: number) => ({ payload: { skip: (page * 8) - 8, limit: 8 } }),
      adapter,
    } as unknown as Site;
    const payloadOriginal = JSON.parse(JSON.stringify(site.payload));

    mockedAxios.request.mockResolvedValue({ data: {} });

    await getImoveis(site, undefined, baseQueryParams, 4);

    expect(site.payload).toEqual(payloadOriginal);
    expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ skip: 24, limit: 8 }),
    }));
  });

  it('não muta site.params ao traduzir os filtros do usuário', async () => {
    // Sem cópia, o filtro de preço de um usuário ficava grudado na configuração do site e
    // vazava para a próxima requisição de qualquer outro.
    const params = { cidade: 'Franca' };
    const site = {
      name: 'get', driver: 'axios', enabled: true,
      url: 'https://exemplo.test/imoveis',
      translateParams: { currentPage: 'pagina', maxPrice: 'precoMax', minPrice: 'precoMin' },
      params: [params],
      itemsPerPage: 12,
      getPaginateParams: (page: number) => ({ params: { pagina: page } }),
      adapter,
    } as unknown as Site;

    mockedAxios.get.mockResolvedValue({ data: '<html></html>' });

    await getImoveis(site, params, { ...baseQueryParams, maxPrice: 350000 }, 1);

    expect(params).toEqual({ cidade: 'Franca' });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      expect.stringContaining('precoMax=350000'),
      expect.anything(),
    );
  });
});

describe('teto de paginacao', () => {
  beforeEach(() => jest.clearAllMocks());

  const pagedSite = (over: Partial<any> = {}) => ({
    name: 'paginado', driver: 'axios', enabled: true,
    url: 'https://exemplo.test/lista',
    params: [{ cidade: 'Franca' }],
    itemsPerPage: 10,
    getPaginateParams: (page: number) => ({ params: { pagina: page } }),
    adapter: jest.fn().mockResolvedValue({ imoveis: [], qtd: 1_000_000_000 }),
    ...over,
  } as unknown as Site);

  it('limita as paginas quando o site reporta um total absurdo', async () => {
    // `qtd` vem do HTML de um site que nao controlamos: sem teto o array de promises inteiro
    // era materializado ANTES do pLimit throttlar, derrubando o processo por memoria.
    const site = pagedSite();
    mockedAxios.get.mockResolvedValue({ data: '<html></html>' });

    await retrieImoveisSiteByParams(site, { cidade: 'Franca' }, baseQueryParams);

    expect((site.adapter as jest.Mock).mock.calls.length).toBe(200);
  });

  it('respeita um maxPages menor que o teto', async () => {
    const site = pagedSite();
    mockedAxios.get.mockResolvedValue({ data: '<html></html>' });

    await retrieImoveisSiteByParams(site, { cidade: 'Franca' }, { ...baseQueryParams, maxPages: 3 });

    expect((site.adapter as jest.Mock).mock.calls.length).toBe(3);
  });

  it('trata itemsPerPage ausente como pagina unica', async () => {
    const site = pagedSite({ itemsPerPage: 0 });
    mockedAxios.get.mockResolvedValue({ data: '<html></html>' });

    await retrieImoveisSiteByParams(site, { cidade: 'Franca' }, baseQueryParams);

    expect((site.adapter as jest.Mock).mock.calls.length).toBe(1);
  });
});

describe('chave de cache por site', () => {
  const base = { ...baseQueryParams, maxPrice: 350000 } as any;

  it('ignora parâmetros que nunca chegam ao site', () => {
    // ~55 dos 60 sites não têm `translateParams`: área, quartos e preço não mudam a
    // requisição feita a eles. Carregar tudo na chave dava ~3e11 chaves possíveis, cada uma
    // custando um scraping completo dos ~60 sites.
    const site = { name: 'sem-params' } as unknown as Site;
    expect(cacheKeyFor(site, base)).toBe(cacheKeyFor(site, { ...base, maxPrice: 900000, quartos: 9 } as any));
  });

  it('mantém na chave o que o site realmente recebe', () => {
    const site = {
      name: 'com-params',
      translateParams: { currentPage: 'pagina', maxPrice: 'precoMax', minPrice: 'precoMin' },
    } as unknown as Site;
    expect(cacheKeyFor(site, base)).not.toBe(cacheKeyFor(site, { ...base, maxPrice: 900000 } as any));
    expect(cacheKeyFor(site, base)).toBe(cacheKeyFor(site, { ...base, quartos: 9, minArea: 300 } as any));
  });

  it('separa sites diferentes', () => {
    const a = { name: 'a' } as unknown as Site;
    const b = { name: 'b' } as unknown as Site;
    expect(cacheKeyFor(a, base)).not.toBe(cacheKeyFor(b, base));
  });
});

describe('normalização da lista', () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const imovel = (over: Partial<any> = {}) => ({
    site: 's', titulo: 't', descricao: '', imagens: [], endereco: 'CENTRO',
    valor: 100000, area: 100, areaTotal: 100, quartos: 2, link: 'https://a/1',
    banheiros: 1, vagas: 1, precoPorMetro: 1000, entrada: 0, ...over,
  });

  it('zera precoPorMetro inválido (área zero gera NaN/Infinity)', () => {
    const out = sanitizeImoveis([imovel({ precoPorMetro: NaN }), imovel({ precoPorMetro: Infinity })]);
    expect(out.map(i => i.precoPorMetro)).toEqual([0, 0]);
  });

  it('joga imóveis sem preço por metro para o fim em vez de tratá-los como os mais baratos', () => {
    const lista = sanitizeImoveis([
      imovel({ link: 'a', precoPorMetro: NaN }),
      imovel({ link: 'b', precoPorMetro: 5000 }),
      imovel({ link: 'c', precoPorMetro: 1000 }),
    ]);
    expect(sortImoveis(lista).map(i => i.link)).toEqual(['c', 'b', 'a']);
  });

  it('ordena de forma estável quando VARIOS imóveis não têm preço por metro', () => {
    // Com `Infinity` dos dois lados o comparador devolvia `Infinity - Infinity` = NaN, e um
    // comparador que devolve NaN deixa a ordem indefinida justamente no caso comum.
    const lista = sanitizeImoveis([
      imovel({ link: 'a', precoPorMetro: NaN }),
      imovel({ link: 'b', precoPorMetro: NaN }),
      imovel({ link: 'c', precoPorMetro: 1000 }),
      imovel({ link: 'd', precoPorMetro: NaN }),
    ]);
    const ordenado = sortImoveis(lista);
    expect(ordenado[0].link).toBe('c');
    expect(ordenado.slice(1).map(i => i.link).sort()).toEqual(['a', 'b', 'd']);
    expect(sortImoveis(lista).map(i => i.link)).toEqual(ordenado.map(i => i.link));
  });

  it('remove o mesmo anúncio repetido entre páginas/params', () => {
    const out = dedupeImoveis([imovel(), imovel(), imovel({ link: 'https://a/2' })]);
    expect(out).toHaveLength(2);
  });

  it('usa site+título+valor como chave quando não há link', () => {
    const out = dedupeImoveis([imovel({ link: '' }), imovel({ link: '' }), imovel({ link: '', valor: 200000 })]);
    expect(out).toHaveLength(2);
  });
});
