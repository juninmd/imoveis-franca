import { adapter } from '../src/sites/sueliandradelopes';

describe('sueliandradelopes adapter', () => {
  it('should parse properties correctly', async () => {
    // Generate a simple mock HTML
    const html = `
      <div class="imovelcard">
        <a class="imovelcard__img" href="/imovel/123/casa-venda"></a>
        <div class="imovelcard__info__ref">Ref: 001 - Casa</div>
        <div class="imovelcard__info__local">Centro, Franca / SP</div>
        <div class="imovelcard__valor__valor">R$ 500.000,00</div>
        <img src="https://example.com/img1.jpg">
        <img data-src="/img2.jpg">
        <img src="logo.png">
        <img data-src="">
        <div class="imovelcard__info__feature">3 Dormitórios</div>
        <div class="imovelcard__info__feature">2 Banheiros</div>
        <div class="imovelcard__info__feature">2 Vagas</div>
        <div class="imovelcard__info__feature">150,00 m²</div>
      </div>
      <div class="imovelcard">
        <a class="imovelcard__img" href="/imovel/124/casa-venda"></a>
        <div class="imovelcard__info__ref">Ref: 002 - Casa</div>
        <div class="imovelcard__info__local">Vila Nova, Franca / SP</div>
        <div class="imovelcard__valor__valor">R$ 0,00</div>
        <div class="imovelcard__info__feature">3 Dormitórios</div>
        <div class="imovelcard__info__feature">2 Banheiros</div>
        <div class="imovelcard__info__feature">2 Vagas</div>
        <div class="imovelcard__info__feature">150,00 m²</div>
      </div>
      <div class="imovelcard">
        <!-- Missing link -->
        <div class="imovelcard__info__ref">Ref: 003 - Casa</div>
      </div>
      <div class="imovelcard">
        <a class="imovelcard__img" href="/imovel/125/casa-venda"></a>
        <div class="imovelcard__info__ref">Ref: 004 - Casa</div>
        <div class="imovelcard__info__local">Vila Nova, Franca / SP</div>
        <div class="imovelcard__valor__valor">R$ 400.000,00</div>
        <div class="imovelcard__info__feature">Quarto</div>
        <div class="imovelcard__info__feature">1 Banheiro</div>
        <div class="imovelcard__info__feature">Vaga</div>
        <div class="imovelcard__info__feature">m²</div>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(2);
    expect(result.imoveis[0].titulo).toBe('Ref: 001 - Casa');
    expect(result.imoveis[0].endereco).toBe('CENTRO');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].area).toBe(150);
    expect(result.imoveis[0].link).toBe('https://www.sueliandradelopes.com.br/imovel/123/casa-venda');
    expect(result.imoveis[0].imagens).toEqual([
      'https://example.com/img1.jpg',
      'https://www.sueliandradelopes.com.br/img2.jpg'
    ]);

    expect(result.imoveis[1].titulo).toBe('Ref: 004 - Casa');
    expect(result.imoveis[1].area).toBe(0);
    expect(result.imoveis[1].quartos).toBe(0);
    expect(result.imoveis[1].banheiros).toBe(1);
    expect(result.imoveis[1].vagas).toBe(0);
  });
});
