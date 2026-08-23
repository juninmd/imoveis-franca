import { adapter } from '../src/sites/grupohabitat';

describe('grupohabitat.com.br', () => {
    it('should parse properties correctly', async () => {
        const html = `
        <h1 class="titulo_busca">2 imóveis à venda encontrados</h1>
        <div class="link_resultado">
            <a class="foto_imovel" href="/comprar/sp/franca/casa/123">
               <img src="foto1.jpg">
               <h3 class="titulo_novo">CASA</h3>
            </a>
            <div class="valor_novo"><h5>R$ 300.000,00</h5></div>
            <div class="final_card"><span>Jardim Adelinha - Franca/SP</span></div>
            <div class="detalhe_novo"><span>3</span> quartos</div>
            <div class="detalhe_novo"><span>2</span> banheiros</div>
            <div class="detalhe_novo"><span>1</span> vaga</div>
            <div class="detalhe_novo"><span>150</span> m²</div>
        </div>
        <div class="link_resultado">
            <a class="botao_ver_mais" href="http://grupohabitat.com.br/comprar/sp/franca/ap/124"></a>
            <h3 class="titulo_novo">APARTAMENTO</h3>
            <div class="valor_novo"><h5>Valor sob consulta</h5></div>
            <div class="final_card"><span>Centro - Franca/SP</span></div>
        </div>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(2);

        expect(result.imoveis).toHaveLength(1); // One with price > 0
        expect(result.imoveis[0].titulo).toBe('CASA');
        expect(result.imoveis[0].valor).toBe(300000);
        expect(result.imoveis[0].endereco).toBe('JARDIM ADELINHA');
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].banheiros).toBe(2);
        expect(result.imoveis[0].vagas).toBe(1);
        expect(result.imoveis[0].area).toBe(150);
        expect(result.imoveis[0].link).toBe('https://grupohabitat.com.br/comprar/sp/franca/casa/123');
    });

    it('should handle zero quantity fallback', async () => {
        const html = `<div></div>`;
        const result = await adapter(html);
        expect(result.qtd).toBe(1000);
        expect(result.imoveis).toHaveLength(0);
    });
});
