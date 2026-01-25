import { retrieImoveisSite, retrieImoveisSiteByParams } from '../src/imoveis';
import { Site } from '../src/types';
import axios from 'axios';

jest.mock('axios');

// Mock console.error to avoid noise
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
  console.info = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

describe('Imoveis Error Handling', () => {

  describe('retrieImoveisSite', () => {
    it('should catch errors when iterating site params fails', async () => {
      const brokenSite = {
        name: 'BrokenSite',
        // @ts-ignore
        params: 123, // Not iterable
        enabled: true
      } as unknown as Site;

      const result = await retrieImoveisSite(brokenSite, {} as any);
      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Erro ao consultar o site BrokenSite'));
    });
  });

  describe('retrieImoveisSiteByParams', () => {
    it('should catch errors when logic fails (e.g. undefined config)', async () => {
      const site = {
        name: 'Site',
        itemsPerPage: 10,
        // Make getImoveis succeed
        getPaginateParams: () => ({ params: {} }),
        // Return enough items to trigger pages > 1
        adapter: async () => ({ imoveis: [], qtd: 20 }),
        driver: 'axios',
        url: 'http://example.com'
      } as unknown as Site;

      (axios.get as jest.Mock).mockResolvedValue({ data: 'html' });

      // Passing undefined as baseQueryParams should cause crash when accessing property
      // in: if (pages <= 1 || (baseQueryParams.maxPages && ...))

      const result = await retrieImoveisSiteByParams(site, undefined, undefined as any);

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Erro ao consultar o site Site'));
    });
  });
});
