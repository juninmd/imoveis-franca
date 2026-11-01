import dias from '../src/sites/diasediasimobiliaria';
import sonia from '../src/sites/soniaeramalhoimoveis';
import { sites } from '../src/sites';

describe('registro das variantes de plataforma (gridlist e kurole)', () => {
  it('Dias & Dias reaproveita o CMS da Vivenda: /secao/<finalidade> com ?pag=', () => {
    const [venda, aluguel] = dias;
    expect([venda.name, aluguel.name]).toEqual(['diasediasimobiliaria.com.br - Comprar', 'diasediasimobiliaria.com.br - Alugar']);
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://www.diasediasimobiliaria.com.br/secao/venda' });
    expect(aluguel.getPaginateParams(2)).toEqual({ url: 'https://www.diasediasimobiliaria.com.br/secao/aluguel?pag=2' });
  });

  it('Sonia & Ramalho reaproveita a plataforma Kurole: /<finalidade>/FRANCA', () => {
    const [venda, aluguel] = sonia;
    expect([venda.name, aluguel.name]).toEqual(['soniaeramalhoimoveis.com.br - Comprar', 'soniaeramalhoimoveis.com.br - Alugar']);
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://www.soniaeramalhoimoveis.com.br/comprar/FRANCA' });
    expect(aluguel.getPaginateParams(1)).toEqual({ url: 'https://www.soniaeramalhoimoveis.com.br/alugar/FRANCA' });
  });

  it('todos os nomes novos sao unicos no registro', () => {
    const names = sites.map(s => s.name);
    [...dias, ...sonia].forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
  });
});
