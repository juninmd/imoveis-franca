import { Imoveis } from '../types';

export const filterImoveis = (imoveis: Imoveis[], queryParams: {
  maxPrice?: number;
  minPrice?: number;
  minBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  minAreaTotal?: number;
  maxAreaTotal?: number;
  minBathrooms?: number;
  minVacancies?: number;
  address?: string[];
}) => {
  const { maxPrice, minPrice, minBedrooms, minArea, maxArea, minAreaTotal, maxAreaTotal, minBathrooms, minVacancies, address } = queryParams;

  return imoveis.filter(imovel => {
    const passMaxPrice = !maxPrice || imovel.valor <= maxPrice;
    const passMinPrice = !minPrice || imovel.valor >= minPrice;
    const passMinArea = !minArea || imovel.area >= minArea;
    const passMaxArea = !maxArea || imovel.area <= maxArea;
    const passMinAreaTotal = !minAreaTotal || imovel.areaTotal >= minAreaTotal;
    const passMaxAreaTotal = !maxAreaTotal || imovel.areaTotal <= maxAreaTotal;
    const passBedRooom = !minBedrooms || imovel.quartos >= minBedrooms;
    const passMinBathroom = !minBathrooms || imovel.banheiros >= minBathrooms;
    const passMinVacancies = !minVacancies || imovel.vagas >= minVacancies;

    const endereco = !address || !!address.find(x => x === imovel.endereco);
    // Verificar se todos os filtros foram satisfeitos
    return passMaxPrice && passMinPrice && passMinArea && passMaxArea && passBedRooom && passMinBathroom && passMinVacancies && passMinAreaTotal && passMaxAreaTotal && endereco;
  });
};

export const sortImoveis = (imoveis: Imoveis[]) => {
  return imoveis.filter(q => q.valor > 0).sort((a, b) => a.precoPorMetro - b.precoPorMetro);
};


export function calcularValorMedioBairroPorAreaTotal(imoveis: Imoveis[]): Imoveis[] {
  const imoveisAtualizados = imoveis.map(imovel => {
    const imoveisMesmoBairro = imoveis.filter(
      i => i.endereco === imovel.endereco && i.areaTotal === imovel.areaTotal && i.areaTotal > 0
    );

    const somaValores = imoveisMesmoBairro.reduce((soma, i) => soma + i.valor, 0);
    const valorMedio = imoveisMesmoBairro.length ? somaValores / imoveisMesmoBairro.length : 0;

    return { ...imovel, valorMedioBairroPorAreaTotal: valorMedio };
  });

  return imoveisAtualizados;
}