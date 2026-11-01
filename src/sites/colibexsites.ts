import { buildColibexSite } from './platforms/colibex';

// 007 SRamos Imoveis (credenciada Caixa) e FCA Imoveis (leiloes): mesma plataforma Colibex.
export default [buildColibexSite('sramosimoveis.com.br'), buildColibexSite('fcaimoveis.com.br')];
