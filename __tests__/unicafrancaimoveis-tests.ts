
import site, { adapter } from '../src/sites/unicafrancaimoveis';

describe('unicafrancaimoveis Site', () => {
    it('should have correct configuration', () => {
        expect(site.name).toContain('unicafrancaimoveis');
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
                <div class="imovelcard" data-link="/imovel/4132682/terreno-venda-franca-sp-jardim-luiza">
                    <div class="row">
                        <a href="/imovel/4132682/terreno-venda-franca-sp-jardim-luiza" title="Terreno para Venda, em Franca, bairro Jardim Luiza" class="col imovelcard__img">
                            <img src="https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-202603191750512576.jpeg" alt="Terreno para Venda, em Franca, bairro Jardim Luiza">
                        </a>
                        <div class="col imovelcard__infocontainer">
                            <div class="col imovelcard__info">
                                <h2 class="imovelcard__info__tag">Venda</h2>
                                <h2 class="imovelcard__info__local">Terreno a venda no Jardim Luiza em Franca - SP, Franca / SP</h2>
                            </div>
                            <div class="col imovelcard__valor">
                                <p class="imovelcard__valor__valor"><span>R$</span> 150.000</p>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
        </html>
        `;
        const result = await adapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].titulo).toBe('TERRENO A VENDA NO JARDIM LUIZA EM FRANCA - SP, FRANCA / SP');
        expect(result.imoveis[0].valor).toBe(150000);
        expect(result.imoveis[0].imagens).toEqual(['https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-202603191750512576.jpeg']);
        expect(result.imoveis[0].link).toBe('https://www.unicafrancaimoveis.com.br/imovel/4132682/terreno-venda-franca-sp-jardim-luiza');
    });

    it('should handle broken HTML gracefully', async () => {
        const html = `
        <html>
            <body>
                <div class="imovelcard">
                    <div class="row"></div>
                </div>
            </body>
        </html>
        `;
        const result = await adapter(html);
        expect(result.imoveis.length).toBe(0);
    });
});
