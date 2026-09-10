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

// Tetos aplicados APENAS ao que vira chave de cache e parametro de busca (getQuantizedParams).
// Aplica-los tambem ao filtro tornava a busca mais restrita do que o usuario pediu: um
// `?maxAreaTotal=50000` (chacara) virava 10000 e escondia todo lote acima de 1 ha.
const MAX_PRICE = 20_000_000;
const MAX_AREA = 10_000;
const MAX_ADDRESSES = 30;
const MAX_ADDRESS_LEN = 120;

const toNumber = (raw: unknown): number | undefined => {
  if (Array.isArray(raw)) {
    return toNumber(raw[0]);
  }
  if (raw === undefined || raw === null || raw === '' || typeof raw === 'object') {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return value;
};

const clamp = (value: number | undefined, fallback: number, max: number): number =>
  Math.min(value ?? fallback, max);

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
    minPrice: toNumber(raw.minPrice),
    maxPrice: toNumber(raw.maxPrice),
    minArea: toNumber(raw.minArea),
    maxArea: toNumber(raw.maxArea),
    minAreaTotal: toNumber(raw.minAreaTotal),
    maxAreaTotal: toNumber(raw.maxAreaTotal),
    minBedrooms: toNumber(raw.minBedrooms),
    minBathrooms: toNumber(raw.minBathrooms),
    minVacancies: toNumber(raw.minVacancies),
    address: toAddressList(raw.address),
    tipo: tipo === 'venda' || tipo === 'aluguel' ? tipo : undefined,
  };
};

export const getQuantizedParams = (filters: QueryFilters): BaseQueryParams => ({
  // Quantiza para baixo no minimo e para cima no maximo: o conjunto buscado e sempre um
  // superconjunto do que o filtro pede, entao a mesma chave de cache serve varias buscas.
  // O teto entra aqui (e so aqui) para limitar o espaco de chaves de cache.
  minPrice: Math.floor(clamp(filters.minPrice, 0, MAX_PRICE) / PRICE_STEP) * PRICE_STEP,
  maxPrice: Math.ceil(clamp(filters.maxPrice || undefined, 2000000, MAX_PRICE) / PRICE_STEP) * PRICE_STEP,
  quartos: filters.minBedrooms || 2,
  minArea: Math.floor(clamp(filters.minArea, 0, MAX_AREA) / AREA_STEP) * AREA_STEP,
  maxArea: Math.ceil(clamp(filters.maxArea || undefined, 500, MAX_AREA) / AREA_STEP) * AREA_STEP,
  maxPages: undefined,
});
