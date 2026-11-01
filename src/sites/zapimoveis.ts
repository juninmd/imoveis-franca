import { buildPortalSites } from './platforms/portal';
import { parseZapGroupListings } from './platforms/zapgroup';

const HOST = 'https://www.zapimoveis.com.br';
const base = (tipo: string) => `${HOST}/${tipo}/imoveis/sp+franca/`;

export const adapter = (html: string, siteName = 'zapimoveis.com.br') => parseZapGroupListings(html, siteName, HOST);

// axios recebe 403 (fingerprint de TLS); o Chromium do projeto passa.
export default buildPortalSites({
  host: HOST,
  label: 'zapimoveis.com.br',
  pageSize: 30,
  maxPages: 30,
  driver: 'puppet',
  parser: parseZapGroupListings,
  firstPageUrl: base,
  pageUrl: (tipo, page) => `${base(tipo)}?pagina=${page}`,
});
