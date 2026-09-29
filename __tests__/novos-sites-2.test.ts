import { adapter as wi7Adapter } from '../src/sites/wi7imobiliaria';
import { adapter as luanaAdapter } from '../src/sites/luanaimoveis';
import { adapter as fortsAdapter } from '../src/sites/fortscunha';

describe('Novos sites de Franca', () => {
    it('deve extrair dados da wi7imobiliaria', async () => {
        const html = `
            <ul class="pagination"><li><a href="imoveis/a-venda/franca/pagina-2">2</a></li></ul>
            <div class="thumbnail recent-properties-box">
                <h1 class="title"><a href="/imovel/test">Casa Teste</a></h1>
                <div class="price">R$ 500.000,00</div>
                <div class="location">Centro</div>
                <img src="/img.jpg" />
                <ul class="facilities-list">
                    <li>3 Quartos</li>
                    <li>2 Banheiros</li>
                    <li>2 Garagem</li>
                    <li>150 m</li>
                </ul>
            </div>
            <div class="thumbnail recent-properties-box">
                <h1 class="title"><a href="/imovel/test2">Casa 2</a></h1>
                <div class="price">Consulte</div>
            </div>
        `;
        const result = await wi7Adapter(html);
        expect(result.qtd).toBe(4); // 2 items * 2 pages
        expect(result.imoveis).toHaveLength(2);
        expect(result.imoveis[0].titulo).toBe('Casa Teste');
        expect(result.imoveis[0].valor).toBe(0);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].banheiros).toBe(2);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].area).toBe(150);
        expect(result.imoveis[0].link).toBe('https://www.wi7imobiliaria.com.br/imovel/test');
        expect(result.imoveis[0].imagens).toEqual(['https://www.wi7imobiliaria.com.br/img.jpg']);
        expect(result.imoveis[1].valor).toBe(0);
    });

    it('deve extrair dados da fortscunha', async () => {
        const html = `
            <div class="pagination">
                <a href="#">1</a>
                <a href="#">3</a>
            </div>
            <div class="col-md-4 property-card">
                <h3 class="title">Apartamento Lindo</h3>
                <div class="price">R$ 200.000,00</div>
                <a href="/imovel/123">Detalhes</a>
                <div class="location">Franca - Bairro X</div>
                <img src="/test.jpg" />
            </div>
        `;
        const result = await fortsAdapter(html);
        expect(result.qtd).toBe(36); // 3 pages * 12
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].valor).toBe(0);
        expect(result.imoveis[0].endereco).toBe('BAIRRO X');
        expect(result.imoveis[0].link).toBe('https://www.fortscunha.com.br/imovel/123');
    });

    it('deve extrair dados da luanaimoveis (simulado)', async () => {
        // Simulando o JSON que vem no window.$MC
        const mockData = {
            o: {
                w: [
                    ["s0-11", 0, {
                        pages: [
                            {
                                template: "search",
                                data: {
                                    search: {
                                        listings: [
                                            {
                                                url: "teste-imovel",
                                                title: "Casa Nova",
                                                prices: [{ price: 300000 }],
                                                address: { neighborhood: "Jardim Y" },
                                                details: [
                                                    { name: 'area', value: '100' },
                                                    { name: 'bedrooms', value: '2' },
                                                    { name: 'bathrooms', value: '1' },
                                                    { name: 'garages', value: '2' }
                                                ],
                                                images: [{ url: "img1.jpg" }],
                                                code: "12345"
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }]
                ]
            }
        };
        const html = `
            <script>
                (window.$MC||[]).concat(${JSON.stringify(mockData)});
            </script>
        `;
        const result = await luanaAdapter(html);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].titulo).toBe('Casa Nova');
        expect(result.imoveis[0].valor).toBe(300000);
        expect(result.imoveis[0].quartos).toBe(2);
        expect(result.imoveis[0].link).toBe('https://www.luanaimoveis.com.br/imovel/teste-imovel');
    });

    it('deve tratar erro na luanaimoveis', async () => {
        const html = `
            <script>
                (window.$MC||[]).concat({ o: { w: [] } }); // missing struct
            </script>
        `;
        const result = await luanaAdapter(html);
        expect(result.imoveis).toHaveLength(0);
    });
});
