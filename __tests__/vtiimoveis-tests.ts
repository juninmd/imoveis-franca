import { adapter } from '../src/sites/vtiimoveis';

describe('VTI Imoveis Adapter', () => {
  it('should correctly parse the HTML and return properties', async () => {
    const html = `
      <html>
        <body>
          <div class="item-wrap">
            <div class="item-header">
                <ul class="item-price-wrap hide-on-list">
                    <li class="item-price">R$400.000,00</li>
                </ul>
                <div class="listing-thumb">
                    <img src="https://vtiimoveis.com.br/img.jpg" />
                </div>
            </div>
            <div class="item-body">
                <h2 class="item-title">
                    <a href="https://vtiimoveis.com.br/imovel/123">CASA À VENDA – BAIRRO SÃO JOAQUIM</a>
                </h2>
                <ul class="item-amenities">
                    <li class="h-beds"><span class="hz-figure">3</span></li>
                    <li class="h-baths"><span class="hz-figure">2</span></li>
                    <li class="h-cars"><span class="hz-figure">4</span></li>
                    <li class="h-area"><span class="hz-figure">200</span></li>
                </ul>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await adapter(html);

    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];

    expect(imovel.titulo).toBe('CASA À VENDA – BAIRRO SÃO JOAQUIM');
    expect(imovel.endereco).toBe('BAIRRO SAO JOAQUIM');
    expect(imovel.valor).toBe(400000);
    expect(imovel.area).toBe(200);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(4);
    expect(imovel.link).toBe('https://vtiimoveis.com.br/imovel/123');
    expect(imovel.imagens).toEqual(['https://vtiimoveis.com.br/img.jpg']);
  });
});
