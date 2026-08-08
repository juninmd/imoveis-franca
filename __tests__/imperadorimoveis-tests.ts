
import site, { adapter } from '../src/sites/imperadorimoveis';

describe('imperadorimoveis Site', () => {
    it('should have correct configuration', () => {
        expect(site.name).toContain('imperadorimoveis');
        expect(site.driver).toBe('axios');
        expect(site.getPaginateParams(2)).toBeDefined();
    });

    it('should parse an empty HTML successfully', async () => {
        const result = await adapter('<html><body></body></html>');
        expect(result.imoveis).toEqual([]);
        expect(result.qtd).toBe(0);
    });

    it('should parse HTML with one property successfully', async () => {
        const html = `
        <html>
            <body>
                <div class="card">
                    <a href="/imovel/123/casa">Detalhes</a>
                    <h2 class="card-title">Casa 1</h2>
                    <span class="card-price">R$ 500.000,00</span>
                    <span class="card-address">Jardim Teste</span>
                    <img src="http://imagem.com/1.jpg" />
                </div>
            </body>
        </html>
        `;
        const result = await adapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].titulo).toBe('CASA 1');
        expect(result.imoveis[0].valor).toBe(500000);
        expect(result.imoveis[0].endereco).toBe('JARDIM TESTE');
        expect(result.imoveis[0].imagens).toEqual(['http://imagem.com/1.jpg']);
    });

    it('should handle broken HTML gracefully', async () => {
        const html = `
        <html>
            <body>
                <div class="card">
                    <a href="/imovel/456/broken">Detalhes</a>
                </div>
            </body>
        </html>
        `;
        const result = await adapter(html);
        expect(result.imoveis.length).toBe(0);
    });
});
