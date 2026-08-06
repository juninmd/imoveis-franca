import { adapter } from '../src/sites/transacaoimobiliaria';

describe('transacaoimobiliaria.com.br scraper', () => {
    it('should parse properties correctly', async () => {
        const html = `
            <body>178 Imóveis, Franca, SP</body>
            <div class="c49-property-card">
                <a href="/imoveis/venda/123"><img src="img.jpg" /></a>
                <h3 class="c49-property-title">Casa teste</h3>
                <p class="c49-property-resume">Descrição teste</p>
                <div class="pull-left">Jardim Teste</div>
                <p class="c49-property-value">Venda R$ 500.000,00</p>
                <div class="c49-property-number-wrap"><span class="c49-property-number">100 m²</span></div>
                <div class="c49-property-number-wrap"><span class="c49-property-number">3 quartos</span></div>
                <div class="c49-property-number-wrap"><span class="c49-property-number">2 banh</span></div>
                <div class="c49-property-number-wrap"><span class="c49-property-number">2 vagas</span></div>
            </div>
            <div class="c49-property-card">
                <a href="http://example.com/venda/456"></a>
                <h3 class="c49-property-title">Casa 2</h3>
                <div class="pull-left"></div>
                <p class="c49-property-value">R$ 300.000</p>
            </div>
            <div class="c49-property-card">
                <a href="/outra"></a>
                <p class="c49-property-value">R$ 300.000</p>
            </div>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(178);
        expect(res.imoveis.length).toBe(3);

        expect(res.imoveis[0].titulo).toBe('Casa teste');
        expect(res.imoveis[0].valor).toBe(500000);
        expect(res.imoveis[0].area).toBe(100);
        expect(res.imoveis[0].quartos).toBe(3);
        expect(res.imoveis[0].banheiros).toBe(2);
        expect(res.imoveis[0].vagas).toBe(2);
        expect(res.imoveis[0].link).toBe('https://www.transacaoimobiliaria.com.br/imoveis/venda/123');
        expect(res.imoveis[0].imagens).toEqual(['https://www.transacaoimobiliaria.com.br/img.jpg']);

        expect(res.imoveis[1].endereco).toBe('CASA 2');
        expect(res.imoveis[1].link).toBe('http://example.com/venda/456');
    });

    it('should parse properties fallback cases correctly', async () => {
        const html = `
            <body>10 Imóveis</body>
            <div class="c49-property-card">
                <a href="/imoveis/venda/123"><img src="http://img.jpg" /></a>
                <h3 class="c49-property-title"></h3>
                <h3>Fallback Title</h3>
                <div class="pull-left"></div>
                <p class="c49-property-value">R$ 500.000,00</p>
                <div class="carousel-item"><img src="img2.jpg" /></div>
            </div>
            <div class="c49-property-card"></div>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(10);
        expect(res.imoveis.length).toBe(1);
        expect(res.imoveis[0].titulo).toBe('Fallback Title');
        expect(res.imoveis[0].endereco).toBe('FALLBACK TITLE');
    });
});
