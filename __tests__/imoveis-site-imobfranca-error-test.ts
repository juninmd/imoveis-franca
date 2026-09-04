import { adapter } from '../src/sites/imobfranca';

describe('imobfranca error branch', () => {
    it('should parse html missing data correctly', async () => {
        const html = `
            <body>
                <div class="item-lista">
                    <a href="/imovel/123/casa-venda"></a>
                    <small>Bairro XYZ</small>
                    <div class="icones">
                        <a data-tooltip="Área">abc m²</a>
                    </div>
                </div>
                <div class="item-lista">
                    <!-- no link -->
                </div>
            </body>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(0);
        expect(result.imoveis).toHaveLength(0);
    });
});
