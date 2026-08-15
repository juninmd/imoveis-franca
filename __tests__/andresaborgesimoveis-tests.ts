import { adapter } from '../src/sites/andresaborgesimoveis';

describe('andresaborgesimoveis.com.br adapter', () => {
  it('should parse imoveis correctly', async () => {
    const html = `
      <div class="c49-property-card">
          <header class="c49-property-card_header" onclick="window.open('https://example.com/imovel1', '_self')">
              <h2 class="c49-property-card_title">Casa para venda</h2>
          </header>
          <div class="c49-property-card_address">Jardim Consolação, Franca - SP</div>
          <div class="c49-property-card_rent-price">R$ 500.000,00</div>
          <div class="c49-property-number-wrap" title="Área construída">
              <span class="c49icon-area-1"></span>
              <div class="c49-property-number">200 m²</div>
          </div>
          <div class="c49-property-number-wrap" title="Quartos">
              <span class="c49icon-bedroom-1"></span>
              <div class="c49-property-number">3 quartos</div>
          </div>
          <div class="c49-property-number-wrap" title="Vagas">
              <span class="c49icon-garage-1"></span>
              <div class="c49-property-number">2 vagas</div>
          </div>
          <div class="c49-property-number-wrap" title="Banheiros">
              <span class="c49icon-bathroom-1"></span>
              <div class="c49-property-number">2 banheiros</div>
          </div>
          <div class="c49-property-card_slide">
              <img src="img1.jpg" />
              <img src="img2.jpg" />
          </div>
      </div>
    `;

    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa para venda');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].area).toBe(200);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].endereco).toBe('JARDIM CONSOLACAO');
    expect(result.imoveis[0].imagens).toEqual(['img1.jpg', 'img2.jpg']);
  });

  it('should ignore rentals and missing titles', async () => {
     const html = `
        <div class="c49-property-card">
           <h2 class="c49-property-card_title"></h2>
        </div>
        <div class="c49-property-card">
           <header class="c49-property-card_header" onclick="window.open('link', '_self')">
               <h2 class="c49-property-card_title">Casa para locação</h2>
           </header>
        </div>
     `;
     const result = await adapter(html);
     expect(result.imoveis.length).toBe(0);
  });

  it('should handle missing values correctly', async () => {
     const html = `
       <div class="c49-property-card">
           <header class="c49-property-card_header" onclick="window.open('link', '_self')">
               <h2 class="c49-property-card_title">Terreno para venda</h2>
           </header>
           <div class="c49-property-card_address">Franca</div>
           <div class="c49-property-card_rent-price">Consulte</div>
       </div>
     `;
     const result = await adapter(html);
     expect(result.imoveis.length).toBe(0); // value is 0
  });
});
