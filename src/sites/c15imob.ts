import { buildImoviewSites } from './platforms/imoview';

// Imoview (cdn.imoview.com.br): a listagem vem de POST /retornar-imoveis-disponiveis, nao do HTML.
export default buildImoviewSites('www.c15imob.com.br', 'c15imob.com.br');
