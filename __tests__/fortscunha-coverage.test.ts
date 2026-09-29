import site from '../src/sites/fortscunha';

describe('Forts Cunha Site', () => {
    it('should parse html correctly', async () => {
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
        const res = await site.adapter(html);
        expect(res.imoveis.length).toBe(1);
        expect(res.imoveis[0].titulo).toBe('Casa Linda em Centro');
        expect(res.imoveis[0].quartos).toBe(3);
    });

    it('should handle zero area properly', async () => {
        const html = `
          <div class="recent-properties-box">
            <div class="title"><a href="/imovel/123">Casa Linda em Centro</a></div>
            <div class="location">Centro, Franca</div>
            <div class="tag-s">venda</div>
            <div class="price">R$ 500.000,00</div>
        </div>
        `;
        const res = await site.adapter(html);
        expect(res.imoveis[0].area).toBe(0);
        expect(res.imoveis[0].precoPorMetro).toBe(0);
    });
});
