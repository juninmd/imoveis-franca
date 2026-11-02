import { buildFastimobSites } from './platforms/fastimob';

// Fastimob: a listagem mistura venda e locacao, entao o filtro de finalidade fica no parser.
export default buildFastimobSites('https://www.projetoimoveisfranca.com.br', 'projetoimoveisfranca.com.br');
