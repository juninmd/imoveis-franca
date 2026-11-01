import imobiliariazago from '../src/sites/imobiliariazago';


describe('imobiliariazago', () => {
  it('should return empty array if no imoveis found', async () => {
    const result = await imobiliariazago.adapter('');
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(0);
  });
});
