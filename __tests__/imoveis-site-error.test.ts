import { retrieImoveisSite } from '../src/imoveis';
import { Site } from '../src/types';

describe('retrieImoveisSite Error Handling', () => {
  it('should catch errors when site.params access fails', async () => {
    const buggySite: Site = {
      name: 'BuggySite',
      url: 'http://buggy.com',
      driver: 'axios',
      adapter: async () => ({ imoveis: [], qtd: 0 }),
      get params() {
        throw new Error('Params Access Error');
      }
    } as any;

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const result = await retrieImoveisSite(buggySite, {
      minPrice: 0, maxPrice: 1000, minArea: 0, maxArea: 1000, quartos: 1
    });

    expect(result).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao consultar o site BuggySite: Params Access Error'));

    consoleSpy.mockRestore();
  });
});
