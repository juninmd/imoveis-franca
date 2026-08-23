import { adapter } from '../src/sites/dinizmartins';

describe('dinizmartins.com.br', () => {
    it('should parse properties correctly', async () => {
        const html = `
        <div>2 imóveis</div>
        <div class="recent-properties-box">
            <a href="/imovel/vende/sp/jardim-adelinha/franca/casa/123">
                <img src="foto1.jpg">
            </a>
            <h1 class="title">VENDE</h1>
            <div class="price">R$ 300.000,00</div>
            <h3 class="location">Jardim Adelinha</h3>
            <ul class="facilities-list">
                <li><i class="fa fa-bed"></i> 3</li>
                <li><i class="fa fa-bath"></i> 2</li>
                <li><i class="fa fa-car"></i> 1</li>
                <li>150 m²</li>
            </ul>
        </div>
        <div class="recent-properties-box">
            <a href="http://dinizmartins.com.br/imovel/vende/sp/centro/franca/apartamento/124"></a>
            <h1 class="title">VENDE</h1>
            <div class="price">Consulte</div>
        </div>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(2);

        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].titulo).toBe('CASA');
        expect(result.imoveis[0].valor).toBe(300000);
        expect(result.imoveis[0].endereco).toBe('JARDIM ADELINHA');
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].banheiros).toBe(2);
        expect(result.imoveis[0].vagas).toBe(1);
        expect(result.imoveis[0].area).toBe(150);
        expect(result.imoveis[0].link).toBe('https://dinizmartins.com.br/imovel/vende/sp/jardim-adelinha/franca/casa/123');
    });

    it('should handle zero quantity fallback', async () => {
        const html = `<div></div>`;
        const result = await adapter(html);
        expect(result.qtd).toBe(1000);
        expect(result.imoveis).toHaveLength(0);
    });
});
