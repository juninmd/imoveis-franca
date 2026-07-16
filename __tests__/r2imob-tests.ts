import r2imob, { adapter } from '../src/sites/r2imob';

describe('r2imob', () => {
  it('should adapt HTML correctly', async () => {
    const html = `
    <div class="box-imovel">
      <a href="/imovel/123">
         <div class="property-title">Casa Nova</div>
         <div class="property-neighborhood">Centro</div>
         <div class="property-value">
            <span class="top-info"><b>$ 500,000.00</b></span>
         </div>
         <div class="imovel-icon-item">
            <span class="top-info" title="3 dormitórios">3</span>
         </div>
         <div class="imovel-icon-item">
            <span class="top-info" title="2 banheiros">2</span>
         </div>
         <div class="imovel-icon-item">
            <span class="top-info" title="2 vagas">2</span>
         </div>
         <div class="imovel-icon-item">
            <span class="top-info">área: 120m²</span>
         </div>
         <img src="/img.jpg" />
      </a>
    </div>
    `;

    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Nova');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].area).toBe(120);
    expect(imoveis[0].endereco).toBe('CENTRO');
    expect(r2imob.getPaginateParams(2)).toEqual({ url: 'https://r2imob.com.br/busca?orst=dta&topr=1&pg=2' });
  });

  it('should handle alternate price format', async () => {
    const html = `
    <div class="box-imovel">
      <a href="/imovel/123">
         <div class="property-title">Casa Nova</div>
         <div class="property-neighborhood">Centro</div>
         <div class="property-value">VENDA $ 500,000.00</div>
         <img src="/img.jpg" />
      </a>
    </div>
    `;

    const { imoveis } = await adapter(html);
    expect(imoveis[0].valor).toBe(500000);
  });

  it('should ignore item without title', async () => {
    const html = '<div class="box-imovel"><a href="/imovel/123"></a></div>';
    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(0);
  });
});
