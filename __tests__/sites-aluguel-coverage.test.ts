import { sites } from '../src/sites';

describe('sites com finalidade aluguel', () => {
  it('inclui as novas variantes de aluguel (aacosta, imoveismpb)', () => {
    const aluguelSites = sites.filter(s => s.tipo === 'aluguel').map(s => s.name);
    expect(aluguelSites).toEqual(expect.arrayContaining([
      'aacosta.com.br - Alugar',
      'imoveismpb.com.br - Alugar',
    ]));
  });

  it('mantém a variante de venda correspondente', () => {
    const names = sites.map(s => s.name);
    expect(names).toEqual(expect.arrayContaining(['aacosta.com.br']));
    const aacostaVenda = sites.find(s => s.name === 'aacosta.com.br');
    expect(aacostaVenda?.tipo).toBe('venda');
  });
});
