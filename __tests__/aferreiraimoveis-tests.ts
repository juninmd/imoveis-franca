import { adapter } from '../src/sites/aferreiraimoveis';

describe('aferreiraimoveis adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda-franca-sp">
        <a class="imovelcard__img" title="Casa em Franca">
          <img src="/img1.jpg" />
        </a>
        <div class="imovelcard__info__local">Centro, Franca</div>
        <div class="imovelcard__valor__valor"><span>R$</span> 200.000</div>
        <div class="imovelcard__info__feature">100m²</div>
        <div class="imovelcard__info__feature"><i class="fa fa-bed"></i>2</div>
        <div class="imovelcard__info__feature"><i class="fa fa-bath"></i>1</div>
        <div class="imovelcard__info__feature"><i class="fa fa-car"></i>1</div>
      </div>
      <a href="/imovel/venda/?pag=5" class="lipagina-btn-paginacao">Última</a>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(75);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Casa em Franca');
    expect(result.imoveis[0].valor).toBe(200000);
    expect(result.imoveis[0].quartos).toBe(2);
    expect(result.imoveis[0].banheiros).toBe(1);
    expect(result.imoveis[0].vagas).toBe(1);
    expect(result.imoveis[0].area).toBe(100);
  });

  it('should parse fallback values correctly', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda-franca-sp">
        <a class="imovelcard__img" title=""></a>
        <div class="imovelcard__info__local"></div>
        <div class="imovelcard__valor__valor"><span>R$</span> 200.000</div>
      </div>
    `;
    const result = await adapter(html);
    expect(result.qtd).toBe(50);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('Imóvel em FRANCA');
  });

  it('should handle zero value', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda-franca-sp">
        <a class="imovelcard__img" title=""></a>
        <div class="imovelcard__info__local"></div>
        <div class="imovelcard__valor__valor"><span>R$</span> 0</div>
      </div>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });

  it('should ignore missing links', async () => {
    const html = `<div class="imovelcard"></div>`;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(0);
  });

  it('should correctly parse alternative feature text', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda-franca-sp">
        <a class="imovelcard__img" title="Casa em Franca"><img src="http://example.com/img1.jpg" /></a>
        <div class="imovelcard__info__local">Centro, Franca</div>
        <div class="imovelcard__valor__valor"><span>R$</span> 200.000</div>
        <div class="imovelcard__info__feature">3 quartos</div>
        <div class="imovelcard__info__feature">2 suítes</div>
        <div class="imovelcard__info__feature">2 vagas</div>
      </div>
    `;
    const result = await adapter(html);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].imagens[0]).toBe('http://example.com/img1.jpg');
  });

  it('should parse features without numbers correctly', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda-franca-sp">
        <a class="imovelcard__img" title="Casa em Franca"><img src="http://example.com/img1.jpg" /></a>
        <div class="imovelcard__info__local">Centro, Franca</div>
        <div class="imovelcard__valor__valor"><span>R$</span> 200.000</div>
        <div class="imovelcard__info__feature">quarto</div>
        <div class="imovelcard__info__feature">suíte</div>
        <div class="imovelcard__info__feature">vaga</div>
      </div>
    `;
    const result = await adapter(html);
    expect(result.imoveis[0].quartos).toBe(0);
    expect(result.imoveis[0].banheiros).toBe(0);
    expect(result.imoveis[0].vagas).toBe(0);
  });
});
