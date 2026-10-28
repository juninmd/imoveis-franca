import imobiliariaestillo from '../src/sites/imobiliariaestillo';

describe('imobiliariaestillo', () => {
  it('should parse properties correctly', async () => {
    const mockHtml = `
      <div class="resultado">
        <div class="foto">
          <a href="/comprar/123">
            <img src="test.jpg" title="Test Property" />
          </a>
        </div>
        <div class="info_imoveis">
          <h3 class="tipo">CASA</h3>
          <h4 class="bairro">Centro</h4>
          <div class="valor"><h5>R$ 500.000,00</h5></div>
          <div class="detalhes">
            <div title="Dormitórios"><span>3</span></div>
            <div title="Banheiros"><span>2</span></div>
            <div title="Vagas"><span>1</span></div>
            <div title="Área"><span>150</span></div>
          </div>
        </div>
      </div>
    `;

    const properties = (imobiliariaestillo as any).adapter(mockHtml);

    expect(await properties).toHaveProperty('imoveis'); expect((await properties).imoveis).toHaveLength(1);
    expect((await properties).imoveis[0]).toMatchObject({
      site: 'imobiliariaestillo.com.br',
      link: 'https://www.imobiliariaestillo.com.br/comprar/123',
      titulo: 'Test Property',
      valor: 500000,
      imagens: ['test.jpg'],
      descricao: 'CASA',
      endereco: 'CENTRO',
      quartos: 3,
      banheiros: 2,
      vagas: 1,
      area: 150,
      areaTotal: 150,
      tipo: 'venda'
    });
  });

  it('should handle missing URL gracefully', async () => {
    const mockHtml = `
      <div class="resultado">
        <div class="foto">
        </div>
      </div>
    `;
    const properties = (imobiliariaestillo as any).adapter(mockHtml);
    expect(await properties).toHaveProperty('imoveis'); expect((await properties).imoveis).toHaveLength(0);
  });
});
