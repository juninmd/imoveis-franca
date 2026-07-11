import { adapter } from '../src/sites/unioconimobiliaria';
import unioconimobiliaria from '../src/sites/unioconimobiliaria';

describe('Uniocon Imobiliaria Adapter', () => {
  it('should get correct paginate params', () => {
    expect(unioconimobiliaria.getPaginateParams(1)).toEqual({
      url: 'https://www.unioconimobiliaria.com.br/buscar?availability=buy&direction=desc&order=most_relevant&search_type=properties_map'
    });

    expect(unioconimobiliaria.getPaginateParams(2)).toEqual({
      url: 'https://www.unioconimobiliaria.com.br/buscar?availability=buy&direction=desc&order=most_relevant&page=2&search_type=properties_map'
    });
  });

  it('should parse HTML correctly', async () => {
    const mockHtml = `
      <body>
        <div>15 Imóveis encontrados</div>
        <div class="property-card">
            <h2>Casa para Venda em Franca / SP no bairro Jardim Paulista</h2>
            <b>R$ 350.000</b>
            <div>bed 3</div>
            <div>bathtub 2</div>
            <div>directions_car 2</div>
            <div>150 m²</div>
            <a href="/imovel/123">Link</a>
            <img src="https://img.com/1" />
        </div>
      </body>
    `;

    const { imoveis, qtd } = await adapter(mockHtml);

    expect(qtd).toBe(15);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toEqual(expect.objectContaining({
      titulo: 'Casa para Venda em Franca / SP no bairro Jardim Paulista',
      endereco: 'JARDIM PAULISTA',
      valor: 350000,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      area: 150,
      areaTotal: 150,
      link: 'https://www.unioconimobiliaria.com.br/imovel/123',
      imagens: ['https://img.com/1'],
      site: 'unioconimobiliaria.com.br',
      entrada: 70000
    }));
  });

  it('should handle edge cases and missing fields', async () => {
    const mockHtml = `
      <body>
        <!-- Missing quantity -->
        <imobzi-property-card>
            <h2>Apartamento em Centro - Franca</h2>
            <div>R$ 200.000</div>
            <div>2 quartos</div>
            <div>1 vagas</div>
            <a href="https://www.unioconimobiliaria.com.br/imovel/456">Link</a>
        </imobzi-property-card>

        <imobzi-property-card>
            <!-- Missing title -->
        </imobzi-property-card>

        <imobzi-property-card>
            <!-- no price -->
            <h2>Apartamento em Centro - Franca</h2>
            <a href="https://www.unioconimobiliaria.com.br/imovel/789">Link</a>
        </imobzi-property-card>
      </body>
    `;

    const { imoveis, qtd } = await adapter(mockHtml);

    expect(qtd).toBe(0);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0].titulo).toBe('Apartamento em Centro - Franca');
    expect(imoveis[0].endereco).toBe('CENTRO');
    expect(imoveis[0].valor).toBe(200000);
    expect(imoveis[0].quartos).toBe(2);
    expect(imoveis[0].vagas).toBe(1);
    expect(imoveis[0].link).toBe('https://www.unioconimobiliaria.com.br/imovel/456');
  });
});
