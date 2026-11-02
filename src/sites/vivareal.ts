import { buildPortalSites } from './platforms/portal';
import { parseZapGroupListings, ZAP_GROUP_SALE_BANDS } from './platforms/zapgroup';

const HOST = 'https://www.vivareal.com.br';
const base = (tipo: string) => `${HOST}/${tipo}/sp/franca/`;

export const adapter = (html: string, siteName = 'vivareal.com.br') => parseZapGroupListings(html, siteName, HOST);

// axios recebe 403 (fingerprint de TLS); o Chromium do projeto passa.
export default buildPortalSites({
  host: HOST,
  label: 'vivareal.com.br',
  pageSize: 30,
  // O portal so serve ~50 paginas por busca (a 60 volta vazio), mesmo com milhares de anuncios.
  maxPages: 55,
  driver: 'puppet',
  parser: parseZapGroupListings,
  firstPageUrl: base,
  pageUrl: (tipo, page) => `${base(tipo)}?pagina=${page}`,
  bands: tipo => (tipo === 'venda' ? ZAP_GROUP_SALE_BANDS : undefined),
});
