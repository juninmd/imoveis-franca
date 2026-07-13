import { adapter } from '../src/sites/conectaassesconimoveis';

describe('conectaassesconimoveis.com.br scraper', () => {
    it('should parse properties correctly', async () => {
        const html = `
            <body>100 Imóveis à venda em Franca</body>
            <li>
                <a href="/imovel/venda/franca/sp/jardim-teste/123"></a>
                <h2>Casa Teste</h2>
                <p>- Franca</p>
                <div>R$ 500.000,00</div>
                <img src="http://img.jpg" />
                <img src="fallback.png" />
                <div>100 m²</div>
                <div>3 quartos</div>
                <div>2 banheiros</div>
                <div>2 vagas</div>
            </li>
            <li>
                <a href="http://site.com/imovel/456"></a>
                R$ 300.000,00 - Titulo Fallback
                <img data-src="http://img2.jpg" />
            </li>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(100);
        expect(res.imoveis.length).toBe(2);

        expect(res.imoveis[0].titulo).toBe('Casa Teste');
        expect(res.imoveis[0].valor).toBe(500000);
        expect(res.imoveis[0].area).toBe(100);
        expect(res.imoveis[0].quartos).toBe(3);
        expect(res.imoveis[0].banheiros).toBe(2);
        expect(res.imoveis[0].vagas).toBe(2);
        expect(res.imoveis[0].endereco).toBe('JARDIM TESTE');
        expect(res.imoveis[0].imagens).toEqual(['http://img.jpg']);

        expect(res.imoveis[1].titulo).toBe('Imóvel em Franca');
        expect(res.imoveis[1].endereco).toBe('');
        expect(res.imoveis[1].imagens).toEqual(['http://img2.jpg']);
    });

    it('should handle duplicates and fallbacks', async () => {
        const html = `
            <body></body>
            <li>
                <a href="/imovel/123"></a>
                <h2>Casa Teste</h2>
                <div>R$ 500.000,00</div>
            </li>
            <li>
                <a href="/imovel/123"></a>
                <h2>Casa Teste Duplicate</h2>
                <div>R$ 500.000,00</div>
            </li>
            <div>
               <a href="/imovel/789"></a>
            </div>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(0);
        expect(res.imoveis.length).toBe(1);
    });
});
