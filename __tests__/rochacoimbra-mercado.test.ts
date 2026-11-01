import { adapter as rochaAdapter } from '../src/sites/rochacoimbraimoveis';
import { adapter as mercadoAdapter } from '../src/sites/mercadoimoveisfranca';
import mercadoimoveisfranca from '../src/sites/mercadoimoveisfranca';
import rochacoimbraimoveis from '../src/sites/rochacoimbraimoveis';

describe('New Sites Adapter Tests', () => {
  it('should test mercadoimoveisfranca adapter', async () => {
      const html = `<div class="property_listing" data-link="https://test.com/imovel/1"><h4 class="listing_title"><a href="https://test.com/imovel/1">Casa em Franca</a></h4><div class="property_location">Centro</div><div class="listing_unit_price_wrapper">R$ 1.500.000,00</div><div class="infosize">100 m²</div><div class="inforoom">3</div><div class="infobath">2</div><div class="infogarage">1</div><div class="listing-unit-img-wrapper" style="background-image: url('img1.jpg')"></div><img src="img2.jpg"/></div>`;
      const result = await mercadoAdapter(html);
      expect(result.imoveis.length).toBe(1);
      expect(result.imoveis[0].titulo).toBe('Casa em Franca');
      expect(result.imoveis[0].valor).toBe(1500000);
      expect(result.imoveis[0].area).toBe(100);
      expect(result.imoveis[0].quartos).toBe(3);
      expect(result.imoveis[0].banheiros).toBe(2);
      expect(result.imoveis[0].vagas).toBe(1);

      const res0 = await mercadoAdapter(`<div class="property_listing"><a href="https://test.com/imovel/1"></a><h4 class="listing_title">Casa</h4></div>`);
      expect(res0.imoveis.length).toBe(0);

      const params = mercadoimoveisfranca.getPaginateParams(2) as any;
      expect(params.url).toContain('2');
  });

  it('should test rochacoimbra adapter', async () => {
      const html = `<div class="card"><a href="/imovel/casa"></a><h2 class="card-title">Casa em Franca</h2><span class="card-text">Centro</span><strong class="preco-imovel-card">R$ 500.000,00</strong><div class="container-icon">150 m²</div><div class="container-icon">3 qto</div><div class="container-icon">2 banh</div><div class="container-icon">2 vg</div><img src="img1.jpg"/></div>
      <div class="card"><a href="https://test.com/imovel/casa2"></a><h2 class="card-title">Apto Centro</h2><strong class="preco-imovel-card">R$ 150.000,00</strong></div>
      <div class="card"><h2 class="card-title">Casa em Franca</h2><a href="/imovel/x"></a><strong class="preco-imovel-card">R$ 1.500.000,00</strong></div>
      `;
      const result = await rochaAdapter(html);
      expect(result.imoveis.length).toBe(0);

      const params = rochacoimbraimoveis.getPaginateParams(2) as any;
      expect(params.url).toContain('2');
  });
});
