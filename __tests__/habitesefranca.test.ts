import { adapter } from '../src/sites/habitesefranca';

describe('habitesefranca.com.br', () => {
    it('should parse properties correctly', async () => {
        const html = `
        <div class="qtd_imoveis_encontrado">2 imóveis</div>
        <div class="resultado">
            <a href="/comprar/sp/franca/casa/123"><img src="foto1.jpg"></a>
            <h3 class="tipo">CASA</h3>
            <h4 class="bairro">Jardim Adelinha</h4>
            <div class="valor"><h5>R$ 300.000,00</h5></div>
            <div class="detalhes">
                <div class="detalhe" title="Dormitórios"><span>3</span></div>
                <div class="detalhe" title="Banheiros"><span>2</span></div>
                <div class="detalhe" title="Vagas"><span>1</span></div>
                <div class="detalhe" title="Área"><span>150</span></div>
            </div>
        </div>
        <div class="resultado">
            <a href="http://habitesefranca.com.br/comprar/sp/franca/ap/124"></a>
            <h3 class="tipo">APARTAMENTO</h3>
            <div class="valor"><h5>Valor sob consulta</h5></div>
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
        expect(result.imoveis[0].link).toBe('https://habitesefranca.com.br/comprar/sp/franca/casa/123');
    });

    it('should handle zero quantity fallback', async () => {
        const html = `<div></div>`;
        const result = await adapter(html);
        expect(result.qtd).toBe(1000);
        expect(result.imoveis).toHaveLength(0);
    });
});
