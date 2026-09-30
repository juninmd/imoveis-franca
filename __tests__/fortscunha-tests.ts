import site from '../src/sites/fortscunha';

describe('fortscunha', () => {
  it('should extract pagination and single-project properties', async () => {
    const html = `
       <div class="recent-properties-box">
            <div class="title"><a href="/imovel/123">Casa Linda em Centro</a></div>
            <div class="location">Centro, Franca</div>
            <div class="tag-s">venda</div>
            <ul class="facilities-list">
                <li><span class="flaticon-bed"></span>3</li>
                <li><span class="flaticon-vehicle"></span>2</li>
                <li><span class="flaticon-holidays"></span>1</li>
            </ul>
            <img class="img-responsive" src="/img.jpg">
            <div class="price">R$ 500.000,00</div>
        </div>
    `;
    const { imoveis } = await site.adapter(html);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Linda em Centro');
    expect(imoveis[0].valor).toBe(500000);
  });
});
