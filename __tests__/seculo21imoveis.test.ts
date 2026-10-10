import seculo21imoveis from '../src/sites/seculo21imoveis';


describe('seculo21imoveis', () => {
  it('should return empty array if no imoveis found', async () => {
    const result = await seculo21imoveis.adapter('');
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(0);
  });
});
