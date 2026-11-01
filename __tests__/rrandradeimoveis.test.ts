import { adapter } from '../src/sites/rrandradeimoveis';

describe('rrandradeimoveis scraper adapter', () => {
  it('should parse properties correctly from DOM', async () => {
    const html = `
      <h1>10 imóveis encontrados</h1>
      <div class="MuiGrid-item">
         <a href="/imovel/abc"></a>
         <h3>Casa Bonita</h3>
         <span>R$ 350.000,00</span>
         <img src="img.jpg" />
         <p>3 dorms</p>
         <p>2 suítes</p>
         <p>2 vagas</p>
         <p>150 m²</p>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(10);
    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];

    expect(imovel.titulo).toBe('Casa Bonita');
    expect(imovel.valor).toBe(350000);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(2);
    expect(imovel.area).toBe(150);
    expect(imovel.link).toBe('https://rrandradeimoveis.com.br/imovel/abc');
  });
});
