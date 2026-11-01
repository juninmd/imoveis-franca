import site, { adapter } from '../src/sites/mazzaimoveis';

describe('Mazza Imoveis Adapter', () => {
  const html = '<html><body><script>self.__next_f.push([1,"39:{\\"items\\":[{\\"recordType\\":\\"property\\", \\"absoluteUrl\\":\\"https://mazzaimoveis.com.br/imovel/2/imovel-para-venda-com-3-quartos-franca-residencial-amazonas\\", \\"name\\":\\"Casa com 3 quartos à venda em Residencial Amazonas  - SP\\", \\"built_area\\":\\"345.49\\", \\"land_area\\":\\"360\\", \\"usable_area\\":null, \\"prices\\":{\\"sale_price\\":2100000}, \\"features\\":{\\"total_area\\":\\"360\\", \\"bedrooms\\":\\"3\\", \\"bathrooms\\":\\"2\\", \\"garage_spaces\\":\\"4\\"}, \\"address\\":{\\"neighborhood\\":\\"Residencial Amazonas\\"}, \\"photos\\":[{\\"sources\\":[\\"https://cdn/p1.jpg\\"]}]}, {\\"recordType\\":\\"property\\", \\"absoluteUrl\\":\\"https://mazzaimoveis.com.br/imovel/3/x\\", \\"name\\":\\"Sem preço\\", \\"prices\\":{\\"sale_price\\":null}, \\"features\\":{}, \\"address\\":{\\"neighborhood\\":\\"Centro\\"}, \\"photos\\":[]}], \\"total\\":60, \\"pagination\\":{\\"current_page\\":1, \\"last_page\\":7}}\\n"])</script></body></html>';

  it('should parse the listing from the Next.js RSC payload', async () => {
    const result = await adapter(html);

    expect(result.qtd).toBe(60);
    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];

    expect(imovel.titulo).toBe('Casa com 3 quartos à venda em Residencial Amazonas - SP');
    expect(imovel.endereco).toBe('RESIDENCIAL AMAZONAS');
    expect(imovel.valor).toBe(2100000);
    expect(imovel.area).toBe(345.49);
    expect(imovel.areaTotal).toBe(360);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(4);
    expect(imovel.link).toBe('https://mazzaimoveis.com.br/imovel/2/imovel-para-venda-com-3-quartos-franca-residencial-amazonas');
    expect(imovel.imagens).toEqual(['https://cdn/p1.jpg']);
  });

  it('should return empty when there is no listing payload', async () => {
    const result = await adapter('<html><body>nada</body></html>');
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(0);
  });

  it('should paginate with ?pagina=N on the Franca search', () => {
    expect(site.url).toBe('https://www.mazzaimoveis.com.br/busca/venda/BR/SP/franca');
    expect(site.getPaginateParams(2)).toEqual({ params: { pagina: 2 } });
  });
});
