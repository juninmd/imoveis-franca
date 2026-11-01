import site, { adapter } from '../src/sites/espaconobreimoveis';

describe('Espaco Nobre Adapter', () => {
  it('should parse the public properties API response', async () => {
    const mockJson = {
      total: 593,
      page: 1,
      page_size: 48,
      items: [
        {
          slug: 'casa-a-venda-no-centro-ca000123',
          purpose: 'sale',
          is_active: true,
          type: { slug: 'house', name: 'Casa' },
          neighborhood: 'Centro',
          city: 'Franca',
          bedrooms: 3,
          bathrooms: 2,
          parking_spots: 2,
          built_area: 200,
          land_area: 300,
          machine: { price: 500000, image_url: 'https://img/cover.jpg' },
          images: [{ kind: 'photo', medium_url: 'https://img/1.jpg', url: 'https://img/1-large.jpg' }]
        },
        { slug: 'sem-preco', purpose: 'sale', type: { name: 'Terreno' }, neighborhood: 'Centro', machine: { price: null } }
      ]
    };

    const result = await adapter(mockJson);

    expect(result.qtd).toBe(593);
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('CASA');
    expect(imovel.valor).toBe(500000);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(2);
    expect(imovel.area).toBe(200);
    expect(imovel.areaTotal).toBe(300);
    expect(imovel.endereco).toBe('CENTRO');
    expect(imovel.link).toBe('https://espaconobreimoveis.com.br/imoveis/casa-a-venda-no-centro-ca000123');
    expect(imovel.imagens).toEqual(['https://img/1.jpg']);
    expect(imovel.site).toBe('espaconobreimoveis.com.br');
  });

  it('should handle empty responses and paginate with ?page=N', async () => {
    const result = await adapter({});
    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(0);
    expect(site.getPaginateParams(3)).toEqual({ params: { page: 3 } });
  });
});
