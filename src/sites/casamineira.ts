import { buildPortalSites } from './platforms/portal';
import { parseNaventListings } from './platforms/navent';

const HOST = 'https://www.casamineira.com.br';
const base = (tipo: string) => `${HOST}/${tipo}/imovel/franca_sp`;

export const adapter = (html: string, siteName = 'casamineira.com.br') => parseNaventListings(html, siteName, HOST);

export default buildPortalSites({
  host: HOST,
  label: 'casamineira.com.br',
  pageSize: 30,
  maxPages: 40,
  driver: 'axios',
  parser: parseNaventListings,
  firstPageUrl: base,
  pageUrl: (tipo, page) => `${base(tipo)}/pagina-${page}`,
});
