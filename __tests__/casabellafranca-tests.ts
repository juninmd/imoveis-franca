import { adapter } from '../src/sites/casabellafranca';

describe('Casa Bella Franca Adapter', () => {
  it('should parse HTML correctly', async () => {
    const html = `
      <div class="pagination">
         <ul>
           <li><a href="1">1</a></li>
           <li><a href="2">2</a></li>
           <li><a href="next">Next</a></li>
         </ul>
      </div>
      <div class="thumbnail recent-properties-box">
        <div class="property-img">
           <img src="img1.jpg">
        </div>
        <div class="detail">
          <h3><a href="/imovel/123">Casa Teste</a></h3>
          <div class="price">R$ 500.000,00</div>
          <h3 class="location">Centro</h3>
        </div>
        <ul class="facilities-list">
          <li>3 Quartos</li>
          <li>2 Banheiros</li>
          <li>1 Garagem</li>
        </ul>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(24);
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Casa Teste em Centro');
    expect(imovel.valor).toBe(500000);
    expect(imovel.quartos).toBe(3);
    expect(imovel.vagas).toBe(1);
    expect(imovel.endereco).toBe('CENTRO');
  });
});
