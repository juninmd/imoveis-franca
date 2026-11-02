import c15 from '../src/sites/c15imob';
import { buildImoviewSites } from '../src/sites/platforms/imoview';
import { sites } from '../src/sites';

describe('Imoview: formulario aceito por todos os tenants', () => {
  // O C15 responde um erro fatal de PHP (count() em string) se `extras` vai como string e um aviso se faltam
  // retornomapaapp/codigoempreendimentomae; o Mudare aceitava tudo, por isso so o C15 expos o bug.
  it('nao envia "extras" e envia os campos que o PHP do C15 exige', () => {
    const [venda] = buildImoviewSites('www.exemplo.com.br', 'exemplo.com.br');
    const form = venda.payload as Record<string, unknown>;
    expect(form).not.toHaveProperty('extras');
    expect(form).toMatchObject({ retornomapaapp: 'false', codigoempreendimentomae: '', finalidade: 'venda', numeroregistros: 20 });
  });

  it('C15: par Comprar/Alugar registrado uma vez, apontando para o endpoint do proprio dominio', () => {
    expect(c15.map(s => s.name)).toEqual(['c15imob.com.br - Comprar', 'c15imob.com.br - Alugar']);
    expect(c15[0].url).toBe('https://www.c15imob.com.br/retornar-imoveis-disponiveis');
    expect(c15.map(s => s.tipo)).toEqual(['venda', 'aluguel']);
    c15.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
