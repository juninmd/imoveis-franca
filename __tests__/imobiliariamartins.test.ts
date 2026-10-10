import imobiliariamartins from '../src/sites/imobiliariamartins';


describe('imobiliariamartins', () => {
  it('should return empty array if no imoveis found', async () => {
    const result = await imobiliariamartins.adapter('');
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(0);
  });
});
