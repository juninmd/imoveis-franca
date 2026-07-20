import { adapter } from '../src/sites/silveiraimoveis';

describe('silveiraimoveis.com.br', () => {
  it('should extract properties correctly', async () => {
    const html = `
    <html><body>
      <div class="property-thumb-info">
        <a href="/imovel/123/VENDA/casa">
          <h2>Casa Linda</h2>
        </a>
        <div class="bairro">Centro -</div>
        <div class="property-thumb-info-label">
          <span class="preco">R$ 500.000,00</span>
        </div>
        <ul class="amenities">
           <li title="Quarto">3 Quartos</li>
           <li title="Banheiro">2 Banheiros</li>
           <li title="Vaga">1 Vaga</li>
           <li title="Área Total">120 m²</li>
        </ul>
        <div class="img-destaque-imovel" style="background-image: url('img1.jpg')"></div>
      </div>
    </body></html>
    `;
    const res = await adapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].titulo).toBe('Casa Linda');
    expect(res.imoveis[0].valor).toBe(500000);
    expect(res.imoveis[0].quartos).toBe(3);
    expect(res.imoveis[0].banheiros).toBe(2);
    expect(res.imoveis[0].vagas).toBe(1);
    expect(res.imoveis[0].area).toBe(120);
    expect(res.imoveis[0].endereco).toBe('CENTRO');
    expect(res.imoveis[0].imagens).toEqual(['img1.jpg']);
  });

  it('should ignore hidden elements or properties without titles', async () => {
    const html = `
    <html><body>
      <div class="property-thumb-info">
        <a href="/imovel/123/VENDA/casa">
          <h2> </h2>
        </a>
      </div>
      <div class="property-thumb-info">
        <a href="/imovel/123/VENDA/casa">
          <h2>Casa Linda</h2>
        </a>
        <div class="property-thumb-info-label">
          <span class="preco">Consulte</span>
        </div>
      </div>
      <div class="property-thumb-info">
        <a href="/imovel/123/VENDA/casa">
          <h2>Casa Linda</h2>
        </a>
        <div class="property-thumb-info-label">
          <span class="preco">R$ 500.000,00</span>
        </div>
        <div class="img-destaque-imovel" data-image="img1.jpg"></div>
        <ul class="amenities">
           <li title="quarto">1 quarto</li>
        </ul>
      </div>
    </body></html>
    `;
    const res = await adapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].imagens).toEqual(['img1.jpg']);
    expect(res.imoveis[0].quartos).toBe(1);
  });
});
