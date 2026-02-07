import axios from 'axios';
import {
  filterImoveis,
  sortImoveis,
  calcularValorMedioBairroPorAreaTotal,
  generateList
} from '../src/imoveis';
import RedisConnection from '../src/infra/redis';
import { Imoveis } from '../src/types';
import { sites } from '../src/sites';

jest.mock('axios');
jest.mock('qs', () => {
  const stringify = jest.fn(() => 'mocked=query');
  return {
    __esModule: true,
    default: { stringify },
    stringify
  };
});
jest.mock('p-limit', () => {
  return {
    __esModule: true,
    default: () => (fn) => fn()
  };
});

// Mock Redis
jest.mock('../src/infra/redis', () => {
  const mockRedisImpl = {
    getKey: jest.fn(),
    setKey: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockRedisImpl,
    RedisConnection: mockRedisImpl
  };
});

// Mock Sites
jest.mock('../src/sites', () => ({
  sites: [
    {
      name: 'MockSite',
      url: 'http://mock.com',
      driver: 'axios',
      enabled: true,
      itemsPerPage: 10,
      adapter: jest.fn(), // Defined inside
      getPaginateParams: (page) => ({ params: { page } }),
      params: [{ tipo: 'teste' }],
      translateParams: { minPrice: 'preco_min' }, // Add this for coverage
      payload: { existing: 'data' } // Add this for coverage
    }
  ]
}));

describe('Imoveis Logic', () => {
  const mockImovel: Imoveis = {
    titulo: 'Casa Teste',
    valor: 500000,
    area: 100,
    areaTotal: 200,
    quartos: 3,
    banheiros: 2,
    vagas: 2,
    endereco: 'CENTRO',
    site: 'mock',
    imagens: [],
    link: 'http://link',
    descricao: 'desc',
    precoPorMetro: 5000,
    entrada: 100000
  };

  const mockAdapter = sites[0].adapter as jest.Mock;

  beforeEach(() => {
      jest.clearAllMocks();
      mockAdapter.mockResolvedValue({ imoveis: [], qtd: 0 });
      (RedisConnection.getKey as jest.Mock).mockResolvedValue(null);
      (axios.get as jest.Mock).mockResolvedValue({ data: '<html></html>' });
  });

  describe('filterImoveis', () => {
    it('should filter by price', () => {
      const imoveis = [
        { ...mockImovel, valor: 100000 },
        { ...mockImovel, valor: 300000 },
        { ...mockImovel, valor: 500000 }
      ];
      const result = filterImoveis(imoveis, { minPrice: 200000, maxPrice: 400000 });
      expect(result).toHaveLength(1);
      expect(result[0].valor).toBe(300000);
    });

    it('should filter by bedrooms', () => {
      const imoveis = [
        { ...mockImovel, quartos: 2 },
        { ...mockImovel, quartos: 3 }
      ];
      const result = filterImoveis(imoveis, { minBedrooms: 3 });
      expect(result).toHaveLength(1);
      expect(result[0].quartos).toBe(3);
    });

    it('should filter by bathrooms, vacancies and area', () => {
      const imoveis = [
        { ...mockImovel, banheiros: 1, vagas: 1, area: 50, areaTotal: 100 },
        { ...mockImovel, banheiros: 3, vagas: 3, area: 150, areaTotal: 300 }
      ];

      // Bathrooms
      expect(filterImoveis(imoveis, { minBathrooms: 2 })).toHaveLength(1);
      // Vacancies
      expect(filterImoveis(imoveis, { minVacancies: 2 })).toHaveLength(1);
      // Min Area
      expect(filterImoveis(imoveis, { minArea: 100 })).toHaveLength(1);
      // Max Area
      expect(filterImoveis(imoveis, { maxArea: 100 })).toHaveLength(1);
      // Min Area Total
      expect(filterImoveis(imoveis, { minAreaTotal: 200 })).toHaveLength(1);
      // Max Area Total
      expect(filterImoveis(imoveis, { maxAreaTotal: 200 })).toHaveLength(1);
    });

    it('should filter by address', () => {
      const imoveis = [
        { ...mockImovel, endereco: 'CENTRO' },
        { ...mockImovel, endereco: 'BAIRRO' }
      ];
      expect(filterImoveis(imoveis, { address: ['CENTRO'] })).toHaveLength(1);
      expect(filterImoveis(imoveis, { address: ['OUTRO'] })).toHaveLength(0);
    });
  });

  describe('sortImoveis', () => {
    it('should sort by price per meter', () => {
      const imoveis = [
        { ...mockImovel, precoPorMetro: 5000 },
        { ...mockImovel, precoPorMetro: 1000 },
        { ...mockImovel, precoPorMetro: 3000 }
      ];
      const result = sortImoveis(imoveis);
      expect(result[0].precoPorMetro).toBe(1000);
      expect(result[1].precoPorMetro).toBe(3000);
      expect(result[2].precoPorMetro).toBe(5000);
    });
  });

  describe('calcularValorMedioBairroPorAreaTotal', () => {
    it('should calculate averages correctly', () => {
      const imoveis = [
        { ...mockImovel, endereco: 'A', areaTotal: 100, valor: 1000 },
        { ...mockImovel, endereco: 'A', areaTotal: 100, valor: 2000 },
        { ...mockImovel, endereco: 'A', areaTotal: 200, valor: 5000 }
      ];
      const result = calcularValorMedioBairroPorAreaTotal(imoveis);

      const item1 = result.find(i => i.valor === 1000);
      expect(item1?.valorMedioBairroPorAreaTotal).toBe(1500); // (1000+2000)/2

      const item3 = result.find(i => i.valor === 5000);
      expect(item3?.valorMedioBairroPorAreaTotal).toBe(5000);
    });
  });

  describe('generateList', () => {
    it('should return cached results if available', async () => {
      (RedisConnection.getKey as jest.Mock).mockResolvedValue([mockImovel]);

      const result = await generateList({ minPrice: 100 });

      expect(RedisConnection.getKey).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(mockAdapter).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not in redis', async () => {
      mockAdapter.mockResolvedValue({ imoveis: [mockImovel], qtd: 1 });

      const result = await generateList({ minPrice: 0 });

      expect(RedisConnection.getKey).toHaveBeenCalled();
      expect(mockAdapter).toHaveBeenCalled();
      expect(RedisConnection.setKey).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should handle pagination', async () => {
        // qtd: 20, itemsPerPage: 10 -> 2 pages
        mockAdapter.mockResolvedValue({ imoveis: [mockImovel], qtd: 20 });

        const result = await generateList({ minPrice: 0 });

        // Page 1 + Page 2
        expect(mockAdapter).toHaveBeenCalledTimes(2);
        expect(result).toHaveLength(2);
    });

    it('should retry on failure', async () => {
        // Fail once, then succeed
        (axios.get as jest.Mock)
          .mockRejectedValueOnce(new Error('Network Error'))
          .mockResolvedValue({ data: '<html></html>' });

        mockAdapter.mockResolvedValue({ imoveis: [mockImovel], qtd: 1 });

        const result = await generateList({ minPrice: 0 });

        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(result).toHaveLength(1);
    });

    it('should stop retrying after max retries', async () => {
        (axios.get as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const result = await generateList({ minPrice: 0 });

        expect(result).toHaveLength(0);
        expect(axios.get).toHaveBeenCalledTimes(4);
    });
  });
});
