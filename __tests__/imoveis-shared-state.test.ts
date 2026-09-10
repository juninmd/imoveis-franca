import axios from 'axios';
import { Site } from '../src/types';
import { dedupeImoveis, getImoveis, sanitizeImoveis, sortImoveis } from '../src/imoveis';

jest.mock('axios');
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

describe('normalização da lista', () => {
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

  it('remove o mesmo anúncio repetido entre páginas/params', () => {
    const out = dedupeImoveis([imovel(), imovel(), imovel({ link: 'https://a/2' })]);
    expect(out).toHaveLength(2);
  });

  it('usa site+título+valor como chave quando não há link', () => {
    const out = dedupeImoveis([imovel({ link: '' }), imovel({ link: '' }), imovel({ link: '', valor: 200000 })]);
    expect(out).toHaveLength(2);
  });
});
