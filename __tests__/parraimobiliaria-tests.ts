import { adapter } from '../src/sites/parraimobiliaria';

describe('Parra Imobiliaria Adapter', () => {
  it('should correctly parse the HTML and return properties', async () => {
    const html = `
      <html>
        <body>
          <div>24 - imóveis disponíveis</div>
          <div class="col-12 col-sm-6 col-md-4 col-lg-3 mt-2">
            <div>
              <h5>Casa em Franca</h5>
              <div class="address">Centro - Franca/SP</div>
              <div>R$ 1.500,00</div>
              <div>
                1 Dorm.
                1 Banho
                1 Garagem
                50m² Const.
                100m² Terreno
              </div>
              <a href="/alugar/Franca/Casa/123">Link</a>
              <img src="/img/123.jpg">
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(24);
    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];

    expect(imovel.titulo).toBe('Casa em Franca');
    expect(imovel.endereco).toBe('CENTRO');
    expect(imovel.valor).toBe(1500); // R$ 1.500,00 -> 1500.00
    expect(imovel.area).toBe(50);
    expect(imovel.areaTotal).toBe(100);
    expect(imovel.quartos).toBe(1);
    expect(imovel.banheiros).toBe(1);
    expect(imovel.vagas).toBe(1);
    expect(imovel.link).toBe('https://www.parraimobiliaria.com.br/alugar/Franca/Casa/123');
    expect(imovel.imagens).toEqual(['https://www.parraimobiliaria.com.br/img/123.jpg']);
  });
});
