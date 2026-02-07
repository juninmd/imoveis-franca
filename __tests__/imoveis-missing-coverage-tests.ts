import { getImoveis, retrieveContent, retrieImoveisSite, retrieImoveisSiteByParams } from '../src/imoveis';
import { Site } from '../src/types';
import BrowserSingleton from '../src/infra/browser';
import axios from 'axios';

jest.mock('../src/infra/browser');
jest.mock('axios');

// Mock p-limit
jest.mock('p-limit', () => {
  return {
    __esModule: true,
    default: () => (fn: any) => fn()
  };
});

// Mock qs
jest.mock('qs', () => ({
  __esModule: true,
  default: {
    stringify: (params: any) => {
        if (!params) return '';
        return Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
    }
  },
  stringify: (params: any) => {
      if (!params) return '';
      return Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
  }
}));

describe('Imoveis Missing Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getImoveis', () => {
    it('should merge params when site has no payload but has params (lines 120-121)', async () => {
      const site = {
        url: 'http://test.com',
        driver: 'axios',
        getPaginateParams: () => ({ params: { p: 1 } }),
        adapter: async () => ({ imoveis: [], qtd: 0 }),
      } as unknown as Site;

      (axios.get as jest.Mock).mockResolvedValue({ data: 'html' });

      await getImoveis(site, { existing: 1 }, {} as any, 1);

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('p=1'), expect.any(Object));
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('existing=1'), expect.any(Object));
    });
  });

  describe('retrieveContent', () => {
    it('should catch timeout error in waitForSelector (line 157)', async () => {
       const mockPage = {
         goto: jest.fn(),
         waitForSelector: jest.fn().mockRejectedValue(new Error('Timeout')),
         content: jest.fn().mockResolvedValue('html'),
         close: jest.fn(),
         setRequestInterception: jest.fn(),
         on: jest.fn()
       };
       (BrowserSingleton.getNewPage as jest.Mock).mockResolvedValue(mockPage);

       const site = {
         driver: 'puppet',
         waitFor: '.selector'
       } as unknown as Site;

       const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

       await retrieveContent('url', site);

       expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Timeout waiting for selector'));
       consoleWarnSpy.mockRestore();
    });
  });

  describe('retrieImoveisSite', () => {
    it('should handle site with payload (lines 186-188)', async () => {
       const site = {
         name: 'PayloadSite',
         payload: { data: 1 },
         getPaginateParams: () => ({ payload: { p: 1 } }),
         itemsPerPage: 10,
         driver: 'axios_rest',
         adapter: async () => ({ imoveis: [{ title: 'A' }], qtd: 1 }),
       } as unknown as Site;

       (axios.request as jest.Mock).mockResolvedValue({ data: 'html' });

       const result = await retrieImoveisSite(site, { maxPages: 1 } as any);

       expect(result).toHaveLength(1);
    });
  });

  describe('retrieImoveisSiteByParams', () => {
    it('should break loop if maxPages reached (line 219)', async () => {
       const site = {
         name: 'PagedSite',
         itemsPerPage: 1,
         getPaginateParams: () => ({ params: {} }),
         driver: 'axios',
         adapter: async () => ({ imoveis: [{ title: 'A' }], qtd: 100 }), // 100 pages
         url: 'http://test.com'
       } as unknown as Site;

       (axios.get as jest.Mock).mockResolvedValue({ data: 'html' });

       const baseQueryParams = { maxPages: 2 } as any;

       await retrieImoveisSiteByParams(site, {}, baseQueryParams);

       expect(axios.get).toHaveBeenCalledTimes(2);
    });
  });
});
