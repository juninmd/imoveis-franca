import { Site } from '../src/types';
import axios from 'axios';

// Mock p-limit BEFORE importing the module under test
jest.mock('p-limit', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      throw new Error('p-limit initialization error');
    }),
  };
});

// Mock axios
jest.mock('axios');

import { retrieImoveisSiteByParams } from '../src/imoveis';

describe('retrieImoveisSiteByParams Error Handling', () => {
  it('should catch errors when p-limit fails', async () => {
    const site: Site = {
      name: 'TestSite',
      url: 'http://test.com',
      driver: 'axios',
      adapter: async () => ({ imoveis: [], qtd: 20 }), // qtd > 0 to trigger pagination logic where p-limit is used
      itemsPerPage: 10,
      waitFor: undefined,
      getPaginateParams: (page) => ({ params: { page }, payload: {} }),
      translateParams: {}
    } as any;

    // Mock axios response for getImoveis -> retrieveContent
    (axios.get as jest.Mock).mockResolvedValue({ data: '<html></html>' });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await retrieImoveisSiteByParams(site, undefined, {
      minPrice: 0, maxPrice: 1000, minArea: 0, maxArea: 1000, quartos: 1
    });

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao consultar o site TestSite: p-limit initialization error'));

    consoleSpy.mockRestore();
  });
});
