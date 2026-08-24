import { retrieImoveisSite } from '../src/imoveis';
import { Site } from '../src/types';
import axios from 'axios';

jest.mock('axios');

beforeAll(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('retrieImoveisSite with an empty params array', () => {
  it('still fetches the site once instead of silently skipping it', async () => {
    // `params: []` é truthy em JS — sem o fix, `if (site.params)` entrava no loop e saía
    // sem nunca chamar o site (0 iterações), retornando [] sem nenhum fetch/log/erro.
    (axios.get as jest.Mock).mockResolvedValue({ data: '<html></html>' });

    const site = {
      name: 'EmptyParamsSite',
      driver: 'axios',
      enabled: true,
      url: 'http://empty-params.example.com',
      itemsPerPage: 10,
      params: [],
      getPaginateParams: () => ({ params: {} }),
      adapter: async () => ({ imoveis: [{ titulo: 'Encontrado' } as any], qtd: 1 }),
    } as unknown as Site;

    const result = await retrieImoveisSite(site, {} as any);

    expect(axios.get).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].titulo).toBe('Encontrado');
  });
});
