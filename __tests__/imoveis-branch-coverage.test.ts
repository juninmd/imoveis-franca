import { retrieImoveisSiteByParams } from '../src/imoveis';
import { Site } from '../src/types';
import axios from 'axios';

jest.mock('axios');

// Mock console to avoid noise
beforeAll(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Imoveis Branch Coverage', () => {
  it('should handle site.adapter returning null imoveis inside pagination loop', async () => {
    // Mock axios to return valid HTML so retrieveContent works
    (axios.get as jest.Mock).mockResolvedValue({ data: '<html></html>' });

    const nullImoveisSite = {
      name: 'NullImoveisSite',
      driver: 'axios',
      enabled: true,
      url: 'http://test.com',
      itemsPerPage: 10,
      getPaginateParams: () => ({ params: {} }),
      // adapter returns null imoveis but indicates there are more items
      adapter: async () => ({ imoveis: null as any, qtd: 20 })
    } as unknown as Site;

    const result = await retrieImoveisSiteByParams(nullImoveisSite, {}, {
        minPrice: 0,
        maxPrice: 1000,
        quartos: 2,
        minArea: 0,
        maxArea: 100,
        maxPages: 2 // Allow pagination
    });

    expect(result).toEqual([]);
  });
});
