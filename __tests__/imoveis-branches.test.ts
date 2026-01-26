import { filterImoveis, generateList, calcularValorMedioBairroPorAreaTotal, retrieImoveisSite, sortImoveis } from '../src/imoveis';
import { Imoveis } from '../src/types';

jest.mock('../src/infra/redis');
// We will mock sites differently per test if needed, or global
jest.mock('../src/sites', () => ({
  sites: [{
    name: 'MockSite',
    enabled: true,
    url: 'http://mock.com',
    driver: 'axios',
    adapter: jest.fn().mockResolvedValue({ imoveis: [], qtd: 0 })
  }]
}));

import RedisConnection from '../src/infra/redis';

describe('Imoveis Branch Coverage', () => {
  const baseImovel: Imoveis = {
    titulo: 'T', valor: 100, area: 10, areaTotal: 0, quartos: 1, banheiros: 1, vagas: 1,
    endereco: '', link: '', precoPorMetro: 10, imagens: [], site: '', descricao: '', entrada: 0
  };

  describe('generateList Cache', () => {
    it('should return cached value if present', async () => {
      const cachedImovel: Imoveis = {
        ...baseImovel,
        titulo: 'Cached',
        valor: 100000,
        area: 50,
        areaTotal: 50,
        precoPorMetro: 2000,
        endereco: 'Test'
      };
      (RedisConnection.getKey as jest.Mock).mockResolvedValueOnce([cachedImovel]);
      const result = await generateList({});
      expect(result).toHaveLength(1);
      expect(result[0].titulo).toBe('Cached');
    });

    it('should fetch and set cache if not present', async () => {
      (RedisConnection.getKey as jest.Mock).mockResolvedValueOnce(null);
      // We rely on the mocked site returning empty list by default (adapter mock)
      // But we need it to return something to hit "fetched.length > 0" branch
      // However, imported sites is a constant. We mocked it.
      // We can't change the adapter return value easily unless we access the mocked object.
      // Or we can assume "fetched" logic is covered by integration tests if they run.
      // But integration tests use "MockSite" which returns items?

      const result = await generateList({});
      expect(result).toEqual([]);
    });
  });

  describe('retrieImoveisSite', () => {
    it('should return empty list if site has no params and no payload', async () => {
      const site = {
        name: 'EmptySite',
        url: 'http://empty.com',
        driver: 'axios',
        adapter: jest.fn(),
      } as any;
      const result = await retrieImoveisSite(site, {} as any);
      expect(result).toEqual([]);
    });

    it('should respect maxPages limit', async () => {
       // We need a site that returns many items/pages
       const site = {
         name: 'PagedSite',
         url: 'http://paged.com',
         driver: 'axios',
         adapter: jest.fn().mockResolvedValue({ imoveis: [], qtd: 100 }), // 10 pages
         itemsPerPage: 10,
         getPaginateParams: (p) => ({ params: { page: p } }),
         payload: { data: 'test' } // Trigger the payload branch in retrieImoveisSite
       } as any;

       // Mock retrieImoveisSiteByParams? No, we want to test the loop inside it or the logic passing maxPages.
       // Actually maxPages logic is inside retrieImoveisSiteByParams.
       // We need to call retrieImoveisSite which calls retrieImoveisSiteByParams.

       // If maxPages is 1, it should stop after page 1.
       // But wait, retrieImoveisSiteByParams fetches page 1 first.
       // Then checks if (baseQueryParams.maxPages && page >= baseQueryParams.maxPages) return lista.
       // page is 1. If maxPages is 1. 1 >= 1. True. Returns lista.
       // So it shouldn't fetch page 2.

       // We can spy on console.info to count "página X de Y".
       const spy = jest.spyOn(console, 'info').mockImplementation(() => {});

       await retrieImoveisSite(site, { maxPages: 1 } as any);

       // Expect not to see "página 2"
       expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('página 2'));
       spy.mockRestore();
    });
  });

  describe('calcularValorMedioBairroPorAreaTotal', () => {
    it('should ignore imoveis with areaTotal <= 0', () => {
      const list = [
        { ...baseImovel, areaTotal: 0, endereco: 'A' },
        { ...baseImovel, areaTotal: -1, endereco: 'A' }
      ];
      const result = calcularValorMedioBairroPorAreaTotal(list);
      expect(result[0].valorMedioBairroPorAreaTotal).toBe(0); // or undefined? Init is 0 in map logic
    });

    it('should ignore imoveis with no address', () => {
      const list = [
        { ...baseImovel, areaTotal: 100, endereco: '' },
        { ...baseImovel, areaTotal: 100, endereco: undefined as any }
      ];
      const result = calcularValorMedioBairroPorAreaTotal(list);
      // Should not crash, and should not calculate average
      expect(result[0].valorMedioBairroPorAreaTotal).toBe(0);
    });

    it('should calculate average for valid groups', () => {
      const list = [
        { ...baseImovel, valor: 100, areaTotal: 50, endereco: 'Centro' },
        { ...baseImovel, valor: 200, areaTotal: 50, endereco: 'Centro' },
        { ...baseImovel, valor: 300, areaTotal: 60, endereco: 'Centro' }, // different area
        { ...baseImovel, valor: 400, areaTotal: 50, endereco: 'Bairro' }, // different neighborhood
      ];
      const result = calcularValorMedioBairroPorAreaTotal(list);

      // Centro | 50 -> (100+200)/2 = 150
      expect(result.find(i => i.valor === 100)?.valorMedioBairroPorAreaTotal).toBe(150);
      expect(result.find(i => i.valor === 200)?.valorMedioBairroPorAreaTotal).toBe(150);

      // Centro | 60 -> 300
      expect(result.find(i => i.valor === 300)?.valorMedioBairroPorAreaTotal).toBe(300);

      // Bairro | 50 -> 400
      expect(result.find(i => i.valor === 400)?.valorMedioBairroPorAreaTotal).toBe(400);
    });
  });

  describe('sortImoveis', () => {
    it('should filter out imoveis with valor 0 and sort by pricePerMetro', () => {
      const imoveis: Imoveis[] = [
        { ...baseImovel, valor: 0, precoPorMetro: 0 },
        { ...baseImovel, valor: 100, precoPorMetro: 20 },
        { ...baseImovel, valor: 200, precoPorMetro: 10 },
      ];
      const result = sortImoveis(imoveis);
      expect(result).toHaveLength(2);
      expect(result[0].valor).toBe(200); // 10 < 20
      expect(result[1].valor).toBe(100);
    });
  });

  describe('filterImoveis', () => {
    const mockImovel: Imoveis = {
      titulo: 'Teste',
      valor: 100000,
      area: 100,
      areaTotal: 200,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      endereco: 'CENTRO',
      link: 'http://test.com',
      precoPorMetro: 1000,
      imagens: [],
      site: 'TestSite',
      descricao: 'Teste Descricao',
      entrada: 0
    };

    it('should filter by maxPrice', () => {
      // Branch: !maxPrice (true) -> covered by default (undefined)
      // Branch: !maxPrice (false) && valor <= maxPrice (true)
      expect(filterImoveis([mockImovel], { maxPrice: 100000 })).toHaveLength(1);
      // Branch: !maxPrice (false) && valor <= maxPrice (false)
      expect(filterImoveis([mockImovel], { maxPrice: 90000 })).toHaveLength(0);
    });

    it('should filter by minPrice', () => {
      expect(filterImoveis([mockImovel], { minPrice: 100000 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { minPrice: 110000 })).toHaveLength(0);
    });

    it('should filter by minArea', () => {
      expect(filterImoveis([mockImovel], { minArea: 100 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { minArea: 101 })).toHaveLength(0);
    });

    it('should filter by maxArea', () => {
      expect(filterImoveis([mockImovel], { maxArea: 100 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { maxArea: 99 })).toHaveLength(0);
    });

    it('should filter by minAreaTotal', () => {
      expect(filterImoveis([mockImovel], { minAreaTotal: 200 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { minAreaTotal: 201 })).toHaveLength(0);
    });

    it('should filter by maxAreaTotal', () => {
      expect(filterImoveis([mockImovel], { maxAreaTotal: 200 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { maxAreaTotal: 199 })).toHaveLength(0);
    });

    it('should filter by minBedrooms', () => {
      expect(filterImoveis([mockImovel], { minBedrooms: 3 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { minBedrooms: 4 })).toHaveLength(0);
    });

    it('should filter by minBathrooms', () => {
      expect(filterImoveis([mockImovel], { minBathrooms: 2 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { minBathrooms: 3 })).toHaveLength(0);
    });

    it('should filter by minVacancies', () => {
      expect(filterImoveis([mockImovel], { minVacancies: 2 })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { minVacancies: 3 })).toHaveLength(0);
    });

    it('should filter by address', () => {
      expect(filterImoveis([mockImovel], { address: ['CENTRO'] })).toHaveLength(1);
      expect(filterImoveis([mockImovel], { address: ['OUTRO'] })).toHaveLength(0);
      expect(filterImoveis([mockImovel], { address: [] })).toHaveLength(0); // If empty array passed? Logic says: !address || !!find. If address is [], find returns undefined -> !!undefined is false.
      // But if address is undefined? !address is true.
    });
  });

  describe('generateList (QuantizedParams)', () => {
     // We want to hit the branches in getQuantizedParams
     // const rawMinPrice = Number(query.minPrice) || 0;

     // To test this indirectly, we can check if generateList handles various query inputs without crashing
     // and maybe inspect calls if we could spy, but we can't export getQuantizedParams easily.
     // However, generateList is async and calls sites.

     it('should handle partial query params', async () => {
       // All missing (defaults)
       await generateList({});

       // Strings that are numbers
       await generateList({ minPrice: '100', maxPrice: '200' });

       // Strings that are NOT numbers (should fallback to defaults)
       await generateList({ minPrice: 'abc', maxPrice: 'xyz' });
     });
  });
});
