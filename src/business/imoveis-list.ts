import RedisConnection from '../infra/redis';
import { sites } from '../sites';
import { BaseQueryParams, Imoveis } from '../types';
import { retrieImoveisSite } from './imovel-wesite';
import { sortImoveis, calcularValorMedioBairroPorAreaTotal } from './utilts';

export const generateList = async (query) => {

  const baseQueryParams: BaseQueryParams = {
    minPrice: 1,
    maxPrice: 500000,
    quartos: 2,
    minArea: 50,
    maxArea: 250,
    maxPages: undefined,
  };

  let lista: Imoveis[] = [];

  const promsies: any[] = [];

  for (const site of sites.filter(q => q.enabled)) {
    const cacheKey: Imoveis[] = await RedisConnection.getKey(site.name);
    if (cacheKey) {
      lista = lista.concat(cacheKey);
      continue;
    }
    promsies.push(retrieImoveisSite(site, baseQueryParams));
  }

  const promisesResolved: Imoveis[][] = await Promise.all(promsies);

  for (const promise of promisesResolved) {
    await RedisConnection.setKey(promise[0].site, promise);
  }

  lista = lista.concat(...promisesResolved);
  lista = filterImoveis(lista, query);
  lista = sortImoveis(lista);
  lista = calcularValorMedioBairroPorAreaTotal(lista);
  return lista;
};

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
