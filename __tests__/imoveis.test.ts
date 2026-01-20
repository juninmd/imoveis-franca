import { calcularValorMedioBairroPorAreaTotal } from '../src/imoveis';
import { Imoveis } from '../src/types';

describe('calcularValorMedioBairroPorAreaTotal', () => {
  it('should calculate average correctly for properties with same address and area', () => {
    const imoveis: Imoveis[] = [
      {
        endereco: 'Centro',
        areaTotal: 100,
        valor: 500000,
        titulo: 'A', precoPorMetro: 0, area: 100, quartos: 0, banheiros: 0, vagas: 0, link: '', imagens: [], site: '', descricao: '', entrada: 0
      },
      {
        endereco: 'Centro',
        areaTotal: 100,
        valor: 600000,
        titulo: 'B', precoPorMetro: 0, area: 100, quartos: 0, banheiros: 0, vagas: 0, link: '', imagens: [], site: '', descricao: '', entrada: 0
      },
      {
        endereco: 'Outro',
        areaTotal: 100,
        valor: 800000,
        titulo: 'C', precoPorMetro: 0, area: 100, quartos: 0, banheiros: 0, vagas: 0, link: '', imagens: [], site: '', descricao: '', entrada: 0
      }
    ];

    const result = calcularValorMedioBairroPorAreaTotal(imoveis);

    expect(result).toHaveLength(3);

    // First two should have average of (500k + 600k) / 2 = 550k
    expect(result[0].valorMedioBairroPorAreaTotal).toBe(550000);
    expect(result[1].valorMedioBairroPorAreaTotal).toBe(550000);

    // Last one should be its own value
    expect(result[2].valorMedioBairroPorAreaTotal).toBe(800000);
  });

  it('should handle properties with distinct areas in same address', () => {
    const imoveis: Imoveis[] = [
      {
        endereco: 'Centro',
        areaTotal: 100,
        valor: 500000,
        titulo: 'A', precoPorMetro: 0, area: 100, quartos: 0, banheiros: 0, vagas: 0, link: '', imagens: [], site: '', descricao: '', entrada: 0
      },
      {
        endereco: 'Centro',
        areaTotal: 200,
        valor: 1000000,
        titulo: 'B', precoPorMetro: 0, area: 200, quartos: 0, banheiros: 0, vagas: 0, link: '', imagens: [], site: '', descricao: '', entrada: 0
      }
    ];

    const result = calcularValorMedioBairroPorAreaTotal(imoveis);

    expect(result[0].valorMedioBairroPorAreaTotal).toBe(500000);
    expect(result[1].valorMedioBairroPorAreaTotal).toBe(1000000);
  });

  it('should handle empty list', () => {
    const result = calcularValorMedioBairroPorAreaTotal([]);
    expect(result).toEqual([]);
  });

  it('should ignore properties with 0 areaTotal', () => {
    const imoveis: Imoveis[] = [
      {
        endereco: 'Centro',
        areaTotal: 0,
        valor: 500000,
        titulo: 'A', precoPorMetro: 0, area: 100, quartos: 0, banheiros: 0, vagas: 0, link: '', imagens: [], site: '', descricao: '', entrada: 0
      }
    ];

    const result = calcularValorMedioBairroPorAreaTotal(imoveis);
    expect(result[0].valorMedioBairroPorAreaTotal).toBe(0);
  });
});
