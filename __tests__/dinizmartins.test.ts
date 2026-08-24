import { adapter } from '../src/sites/dinizmartins';

describe('dinizmartins.com.br', () => {
    it('should parse properties correctly', async () => {
        const html = `
        <div>2 imóveis</div>
        <div class="thumbnail recent-properties-box">
            <a href="https://www.dinizmartins.com.br/imovel/vende/sp/jardim-adelinha/franca/casa/123">
                <img src="foto1.jpg">
            </a>
            <div class="caption detail">
                <header class="clearfix">
                    <h1 class="title"><a href="https://www.dinizmartins.com.br/imovel/vende/sp/jardim-adelinha/franca/casa/123">VENDE</a></h1>
                    <div class="price">R$ 300.000,00</div>
                </header>
                <h3 class="location"><a><i class="fa fa-map-marker"></i>Jardim Adelinha</a></h3>
                <ul class="facilities-list clearfix">
                    <li><i class="flaticon-bed"></i><span>3 Quarto(s)</span></li>
                    <li><i class="flaticon-holidays"></i><span>2 Banheiro(s)</span></li>
                    <li><i class="flaticon-vehicle"></i><span>1 Garagem</span></li>
                    <li>150 m²</li>
                </ul>
            </div>
        </div>
        <div class="thumbnail recent-properties-box">
            <a href="https://www.dinizmartins.com.br/imovel/aluga/sp/centro/franca/apartamento/124"></a>
            <div class="caption detail">
                <header class="clearfix">
                    <h1 class="title">ALUGA</h1>
                    <div class="price">Consulte-nos</div>
                </header>
                <h3 class="location"><i class="fa fa-map-marker"></i>Centro</h3>
                <ul class="facilities-list clearfix">
                    <li><i class="flaticon-bed"></i><span>0 Quarto(s)</span></li>
                    <li><i class="flaticon-holidays"></i><span>0 Banheiro(s)</span></li>
                    <li><i class="flaticon-vehicle"></i><span>0 Garagem</span></li>
                </ul>
            </div>
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
        expect(result.imoveis[0].link).toBe('https://www.dinizmartins.com.br/imovel/vende/sp/jardim-adelinha/franca/casa/123');
    });

    it('should handle zero quantity fallback', async () => {
        const html = `<div></div>`;
        const result = await adapter(html);
        expect(result.qtd).toBe(1000);
        expect(result.imoveis).toHaveLength(0);
    });
});
