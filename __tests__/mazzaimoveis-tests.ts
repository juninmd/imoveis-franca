import { adapter } from '../src/sites/mazzaimoveis';

describe('Mazza Imoveis Adapter', () => {
  it('should correctly parse the HTML and return properties', async () => {
    const html = `
      <html>
        <body>
          <div class="total-imoveis">Casa - 44 resultados encontrados.</div>
          <div class="resultado">
            <div class="info_imoveis">
              <h3 class="tipo">CASA</h3>
              <h4 class="bairro">JARDIM DO ÉDEN</h4>
            </div>
            <div class="valor">
              <h5>R$ 750.000,00</h5>
            </div>
            <div class="detalhe" title="Área">
              <span>250</span><span>m²</span>
            </div>
            <div class="detalhe" title="Dormitórios">
              <span>3</span>
            </div>
            <div class="detalhe" title="Banheiros">
              <span>3</span>
            </div>
            <div class="detalhe" title="Vagas">
              <span>2</span>
            </div>
            <div class="foto">
              <a href="/comprar/sp/franca/jardim-do-eden/casa/72729744"></a>
              <img src="https://cdn.uso.com.br/11689/2023/04/mini_b99957f7f4fa96061ae13b2673bfa6ee.jpg" />
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(44);
    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];

    expect(imovel.titulo).toBe('CASA JARDIM DO ÉDEN');
    expect(imovel.endereco).toBe('JARDIM DO EDEN');
    expect(imovel.valor).toBe(750000);
    expect(imovel.area).toBe(250);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(3);
    expect(imovel.vagas).toBe(2);
    expect(imovel.link).toBe('https://mazzaimoveis.com.br/comprar/sp/franca/jardim-do-eden/casa/72729744');
    expect(imovel.imagens).toEqual(['https://cdn.uso.com.br/11689/2023/04/mini_b99957f7f4fa96061ae13b2673bfa6ee.jpg']);
  });
});
