import { BaseQueryParams } from './types';

export interface QueryFilters {
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
  tipo?: 'venda' | 'aluguel';
}

const PRICE_STEP = 50000;
const AREA_STEP = 50;

// Teto por campo. Sem isso, `?minPrice=<qualquer numero>` gera uma chave de cache nova a cada
// requisicao e dispara um scraping completo dos ~47 sites por chave: memoria do Redis e
// trabalho de rede viram funcao da entrada do usuario.
const MAX_PRICE = 20_000_000;
const MAX_AREA = 10_000;
const MAX_ROOMS = 50;
const MAX_ADDRESSES = 30;
const MAX_ADDRESS_LEN = 120;

const toNumber = (raw: unknown, max: number): number | undefined => {
  if (Array.isArray(raw)) {
    return toNumber(raw[0], max);
  }
  if (raw === undefined || raw === null || raw === '' || typeof raw === 'object') {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.min(value, max);
};

const toAddressList = (raw: unknown): string[] | undefined => {
  // `?address=CENTRO` (valor unico) chega como string e `?address[a]=x` como objeto; ambos
  // quebravam o `.find` do filtro com TypeError -> 500.
  const values = Array.isArray(raw) ? raw : [raw];
  const list = values
    .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
    .map(v => v.trim().slice(0, MAX_ADDRESS_LEN))
    .slice(0, MAX_ADDRESSES);
  return list.length > 0 ? list : undefined;
};

export const parseFilters = (raw: any = {}): QueryFilters => {
  const tipo = Array.isArray(raw.tipo) ? raw.tipo[0] : raw.tipo;

  return {
    minPrice: toNumber(raw.minPrice, MAX_PRICE),
    maxPrice: toNumber(raw.maxPrice, MAX_PRICE),
    minArea: toNumber(raw.minArea, MAX_AREA),
    maxArea: toNumber(raw.maxArea, MAX_AREA),
    minAreaTotal: toNumber(raw.minAreaTotal, MAX_AREA),
    maxAreaTotal: toNumber(raw.maxAreaTotal, MAX_AREA),
    minBedrooms: toNumber(raw.minBedrooms, MAX_ROOMS),
    minBathrooms: toNumber(raw.minBathrooms, MAX_ROOMS),
    minVacancies: toNumber(raw.minVacancies, MAX_ROOMS),
    address: toAddressList(raw.address),
    tipo: tipo === 'venda' || tipo === 'aluguel' ? tipo : undefined,
  };
};

export const getQuantizedParams = (filters: QueryFilters): BaseQueryParams => ({
  // Quantiza para baixo no minimo e para cima no maximo: o conjunto buscado e sempre um
  // superconjunto do que o filtro pede, entao a mesma chave de cache serve varias buscas.
  minPrice: Math.floor((filters.minPrice ?? 0) / PRICE_STEP) * PRICE_STEP,
  maxPrice: Math.ceil((filters.maxPrice || 2000000) / PRICE_STEP) * PRICE_STEP,
  quartos: filters.minBedrooms || 2,
  minArea: Math.floor((filters.minArea ?? 0) / AREA_STEP) * AREA_STEP,
  maxArea: Math.ceil((filters.maxArea || 500) / AREA_STEP) * AREA_STEP,
  maxPages: undefined,
});
