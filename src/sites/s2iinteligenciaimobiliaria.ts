import { Site } from '../types';
import { parseTecimob } from './platforms/tecimob';

const DOMAIN = 's2iinteligenciaimobiliaria.com.br';
const API = 'https://api-sites.tecimob.com.br/api/properties';

// Tecimob (SPA), so venda: o catalogo inteiro vem numa chamada identificada por x-domain.
export default {
  enabled: true,
  tipo: 'venda',
  url: API,
  name: DOMAIN,
  driver: 'axios_rest',
  method: 'GET',
  itemsPerPage: 1000,
  axiosConfig: { headers: { 'x-domain': DOMAIN, Accept: 'application/json' } },
  params: [],
  getPaginateParams: () => ({ url: API }),
  adapter,
} as unknown as Site;

export async function adapter(payload: unknown) {
  return parseTecimob(payload, DOMAIN, DOMAIN, 'venda');
}
