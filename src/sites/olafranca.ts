import { parseMenezes } from './menezesimobi';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://olafranca.com.br';

// Mesma plataforma Univen/Tokko da Menezes: cartoes identicos e rede regional misturada,
// com o filtro de Franca feito pelo caminho do link no parser compartilhado.
export default buildPortalSites({
  host: HOST,
  label: 'olafranca.com.br',
  pageSize: 12,
  maxPages: 100,
  driver: 'axios',
  parser: parseMenezes,
  firstPageUrl: tipo => `${HOST}/${tipo === 'venda' ? 'comprar' : 'alugar'}/`,
  pageUrl: (tipo, page) => `${HOST}/${tipo === 'venda' ? 'comprar' : 'alugar'}/pagina-${page}/`,
});
