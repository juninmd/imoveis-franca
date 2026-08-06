import { adapter } from '../src/sites/casanovaimoveis';

describe('casanovaimoveis adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <body>
        <div>10 Imóveis encontrados</div>
        <div class="recent-properties-box">
          <a href="/imovel/vende/sp/centro/franca/apartamento/123">
            <img src="/fotos/test1.jpg" />
          </a>
          <div class="price">R$ 500.000,00</div>
          <h3 class="location">Centro</h3>
          <ul class="facilities-list">
            <li>3 Dorms</li>
            <li>2 Banheiros</li>
            <li>2 Vagas</li>
            <li>150 m²</li>
          </ul>
        </div>
        <div class="recent-properties-box">
          <a href="/imovel/aluga/sp/centro/franca/apartamento/123"></a>
          <div class="price">R$ 500.000,00</div>
          <h3 class="location">Centro</h3>
        </div>
      </body>
    `;

    const { imoveis, qtd } = await adapter(html);

    expect(qtd).toBe(10);
    expect(imoveis).toHaveLength(1);

    expect(imoveis[0]).toMatchObject({
      titulo: 'Apartamento em CENTRO',
      endereco: 'CENTRO',
      valor: 500000,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      area: 150,
      areaTotal: 150,
      link: 'https://www.casanovaimoveisfranca.com.br/imovel/vende/sp/centro/franca/apartamento/123',
      site: 'casanovaimoveisfranca.com.br',
      imagens: ['https://www.casanovaimoveisfranca.com.br/fotos/test1.jpg'],
    });
  });

  it('should handle edge cases', async () => {
    const html = `
      <body>
        <div class="recent-properties-box">
          <a href="/imovel/vende/sp/centro/franca/apartamento/123">
            <img src="https://example.com/fotos/test1.jpg" />
          </a>
          <div class="price">Consulte-nos</div>
          <h3 class="location">Centro</h3>
        </div>
        <div class="recent-properties-box">
          <a href="/imovel/vende/sp/vila-nova/franca/casa/456"></a>
          <div class="price">R$ 0,00</div>
          <h3 class="location">Vila Nova</h3>
        </div>
        <div class="recent-properties-box">
          <a href="https://www.casanovaimoveisfranca.com.br/imovel/vende/sp/vila-nova/franca/casa/789"></a>
          <div class="price">R$ 400.000,00</div>
          <h3 class="location">Vila Nova</h3>
          <ul class="facilities-list">
            <li>Quarto</li>
            <li>Banho</li>
            <li>Garagem</li>
            <li>mts</li>
          </ul>
        </div>
        <div class="recent-properties-box">
          <div class="price">R$ 400.000,00</div>
        </div>
      </body>
    `;

    const result = await adapter(html);

    expect(result.imoveis).toHaveLength(1);
    expect(result.qtd).toBe(1);

    expect(result.imoveis[0].titulo).toBe('Casa em VILA NOVA');
    expect(result.imoveis[0].area).toBe(0);
    expect(result.imoveis[0].quartos).toBe(0);
    expect(result.imoveis[0].banheiros).toBe(0);
    expect(result.imoveis[0].vagas).toBe(0);
    expect(result.imoveis[0].link).toBe('https://www.casanovaimoveisfranca.com.br/imovel/vende/sp/vila-nova/franca/casa/789');
  });
});
