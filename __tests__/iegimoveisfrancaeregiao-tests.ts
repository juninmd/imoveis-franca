import { adapter } from '../src/sites/iegimoveisfrancaeregiao';

describe('iegimoveisfrancaeregiao adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa">
        <h2 class="imovelcard__info__tag">Casa</h2>
        <h2 class="imovelcard__info__local">Jardim Teste, Franca / SP</h2>
        <p class="imovelcard__valor__valor">R$ 500.000</p>
        <div class="imovelcard__info__feature">
          100 m²
        </div>
        <div class="imovelcard__info__feature">
          <i class="fa fa-bed"></i> 3
        </div>
        <div class="imovelcard__info__feature">
          <i class="fa fa-bath"></i> 2
        </div>
        <div class="imovelcard__info__feature">
          <i class="fa fa-car"></i> 1
        </div>
        <img src="/img.jpg" />
      </div>
    `;

    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(1);
    expect(result.imoveis[0].area).toBe(100);
    expect(result.imoveis[0].endereco).toBe('JARDIM TESTE');
    expect(result.imoveis[0].imagens[0]).toBe('https://www.iegimoveisfrancaeregiao.com.br/img.jpg');
    expect(result.imoveis[0].link).toBe('https://www.iegimoveisfrancaeregiao.com.br/imovel/123/casa');
  });

  it('should ignore imoveis with empty valor or title', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa">
        <h2 class="imovelcard__info__local">Jardim Teste, Franca / SP</h2>
      </div>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });

  it('should only return imoveis from Franca', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa">
        <h2 class="imovelcard__info__tag">Casa</h2>
        <h2 class="imovelcard__info__local">Pedregulho / SP</h2>
        <p class="imovelcard__valor__valor">R$ 500.000</p>
      </div>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });
});
