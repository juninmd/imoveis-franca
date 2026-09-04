import { adapter } from '../src/sites/quintareimoveis';

describe('quintareimoveis', () => {
    it('should parse html correctly', async () => {
        const html = `
            <body>
                <strong>324</strong> im&oacute;veis encontrados
                <div class="item-lista">
                    <a href="/imovel/123/casa-venda"></a>
                    <h3>Casa em Condominio - Franca</h3>
                    <small>Bairro XYZ</small>
                    <div class="desc-item-lista">
                        <ul>
                            <li>R$ 500.000,00</li>
                        </ul>
                    </div>
                    <div class="icones">
                        <a data-tooltip="Área">100 m²</a>
                        <a data-tooltip="Dormitórios">3</a>
                        <a data-tooltip="Banheiros">2</a>
                        <a data-tooltip="Vagas">2</a>
                    </div>
                    <img src="/img/casa.jpg" />
                </div>
            </body>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(324);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].titulo).toBe('Casa em Condominio - Franca');
        expect(result.imoveis[0].valor).toBe(500000);
        expect(result.imoveis[0].area).toBe(100);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].banheiros).toBe(2);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].link).toBe('https://quintareimoveis.com.br/imovel/123/casa-venda');
    });

    it('should parse html without strong tag correctly', async () => {
        const html = `
            <body>
                10 imóveis encontrados
                <div class="item-lista">
                    <a href="https://quintareimoveis.com.br/imovel/123/casa-venda"></a>
                    <h3>Casa em Condominio - Franca</h3>
                    <small>Bairro XYZ</small>
                    R$ 500.000,00
                    <div class="icones">
                        <a data-tooltip="area">100 m²</a>
                        <a data-tooltip="dormitorio">3</a>
                        <a data-tooltip="banheiro">2</a>
                        <a data-tooltip="vaga">2</a>
                    </div>
                    <img src="https://quintareimoveis.com.br/img/casa.jpg" />
                </div>
            </body>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(10);
        expect(result.imoveis).toHaveLength(1);
    });

    it('should return empty if no imoveis', async () => {
        const html = `<body>0 imóveis encontrados</body>`;
        const result = await adapter(html);
        expect(result.qtd).toBe(0);
        expect(result.imoveis).toHaveLength(0);
    });
});
