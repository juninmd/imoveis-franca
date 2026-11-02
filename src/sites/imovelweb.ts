import { buildPortalSites } from './platforms/portal';
import { parseNaventListings } from './platforms/navent';

const HOST = 'https://www.imovelweb.com.br';
const slug = (tipo: string) => `imoveis-${tipo === 'venda' ? 'venda' : 'aluguel'}-franca-sp`;

export const adapter = (html: string, siteName = 'imovelweb.com.br') => parseNaventListings(html, siteName, HOST);

// axios recebe 403 (fingerprint de TLS); o Chromium do projeto passa.
export default buildPortalSites({
  host: HOST,
  label: 'imovelweb.com.br',
  pageSize: 30,
  maxPages: 30,
  driver: 'puppet',
  parser: parseNaventListings,
  firstPageUrl: tipo => `${HOST}/${slug(tipo)}.html`,
  pageUrl: (tipo, page) => `${HOST}/${slug(tipo)}-pagina-${page}.html`,
});
