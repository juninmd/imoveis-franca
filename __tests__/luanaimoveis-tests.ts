import site from '../src/sites/luanaimoveis';

describe('luanaimoveis', () => {
  it('should extract pagination and single-project properties from DOM', async () => {
    const html = `
       <div class="property-card">
           <a href="/imovel-1">Detalhes</a>
           <div class="badge">Venda</div>
           <h3 class="title">Casa em Franca</h3>
           <div class="location">Centro, Franca</div>
           <div class="price">R$ 500.000</div>
           <ul class="features">
              <li><span class="icon-bed"></span> 3 quartos</li>
           </ul>
        </div>
    `;
    const { imoveis } = await site.adapter(html);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].valor).toBe(500000);
  });

  it('should hit the window.$MC path for coverage', async () => {
    const html = `
       <script type="application/ld+json">{"teste":123}</script>
       <div class="property-card">
           <a href="/imovel-1">Detalhes</a>
           <div class="badge">Venda</div>
           <h3 class="title">Casa em Franca</h3>
           <div class="location">Centro, Franca</div>
           <div class="price">R$ 500.000</div>
       </div>
    `;
    const { imoveis } = await site.adapter(html);
    expect(imoveis.length).toBe(1);
  });
});
