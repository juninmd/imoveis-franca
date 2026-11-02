import { buildPortalSites } from './platforms/portal';
import { parseNaventListings } from './platforms/navent';

const HOST = 'https://www.imovelweb.com.br';
const SALE_TYPES = ['casas', 'apartamentos', 'terrenos', 'imoveis-comerciais', 'imoveis-rurais'];
const slug = (tipo: string) => `imoveis-${tipo === 'venda' ? 'venda' : 'aluguel'}-franca-sp`;

export const adapter = (html: string, siteName = 'imovelweb.com.br') => parseNaventListings(html, siteName, HOST);

// axios recebe 403 (fingerprint de TLS); o Chromium do projeto passa.
export default buildPortalSites({
  host: HOST,
  label: 'imovelweb.com.br',
  pageSize: 30,
  // A partir da pagina 5 o Cloudflare exige verificacao que o Chromium headless nao resolve (mesmo com JS):
  // cada listagem rende 4 paginas (120 anuncios), por isso a venda e dividida por tipo de imovel.
  maxPages: 4,
  driver: 'puppet',
  parser: parseNaventListings,
  firstPageUrl: tipo => `${HOST}/${slug(tipo)}.html`,
  pageUrl: (tipo, page) => `${HOST}/${slug(tipo)}-pagina-${page}.html`,
  // Tipos validos para Franca (outros slugs, como chacaras, caem em listagens nacionais).
  variants: tipo => (tipo === 'venda' ? SALE_TYPES.map(type => ({ type })) : undefined),
  variantPageUrl: (_tipo, page, { type }) => `${HOST}/${type}-venda-franca-sp${page > 1 ? `-pagina-${page}` : ''}.html`,
});
