import munhozconsultorimobiliario from '../src/sites/munhozconsultorimobiliario';
import { adapter } from '../src/sites/munhozconsultorimobiliario';

describe('munhozconsultorimobiliario', () => {
  it('should exist and be configured', () => {
    expect(munhozconsultorimobiliario).toBeDefined();
    expect(munhozconsultorimobiliario.enabled).toBe(true);
    expect(munhozconsultorimobiliario.driver).toBe('axios');
  });

  it('should adapter valid html', async () => {
      const html = `
      <article>
        <h3 class="c49-property-card_title">CASA NO CENTRO</h3>
        <a href="/350/imoveis/venda-casa"></a>
        <div class="c49-property-card_address">Centro - Franca</div>
        <div class="c49-property-card_price">R$ 500.000,00</div>
        <div class="c49-property-card_description">Descricao</div>
        <ul class="c49-property-card_icons">
            <li>3 quartos</li>
            <li>2 banheiros</li>
            <li>1 vaga</li>
            <li>150 m²</li>
        </ul>
        <img src="https://test.com/img.jpg" />
      </article>
      `;
      const res = await adapter(html);
      expect(res.imoveis.length).toBe(1);
      expect(res.imoveis[0].titulo).toBe('CASA NO CENTRO');
      expect(res.imoveis[0].valor).toBe(500000);
      expect(res.imoveis[0].quartos).toBe(3);
      expect(res.imoveis[0].banheiros).toBe(2);
      expect(res.imoveis[0].vagas).toBe(1);
      expect(res.imoveis[0].area).toBe(150);
  });
});
