import { buildTecimobSites } from './platforms/tecimob';

// O dominio antigo hrsantos.com.br redireciona para este; o catalogo e so de venda.
export default buildTecimobSites('patrimoniosimob.com.br', 'patrimoniosimob.com.br', ['venda']);
