import francaimoveis from '../src/sites/francaimoveis';

describe('francaimoveis.net adapter', () => {
    it('should parse properties correctly', async () => {
        const mockHtml = `
            <div class="search-pageing-block">
                <ul class="search-pageing pagination">
                    <li><a href="#1">1</a></li>
                    <li><a href="#2">2</a></li>
                </ul>
            </div>
            <div class="test-wrapper">
                <div class="search-detail-right-img-area">
                    <img class="clickable_prop_more_info" rel="/details/apartamento/123" src="/img/foto.jpg">
                </div>
                <div class="project-detail-right-block-content">
                    <p>
                        <a href="#">Apartamento</a><br>
                        <a href="#">Venda</a> <br>
                        <a href="#">2 Dorms/1 Suite/2 Vagas</a> <br>
                        <a href="#">Centro</a>
                    </p>
                    <div class="price">R$ 500.000,00</div>
                </div>
            </div>
        `;
        const res = await francaimoveis.adapter(mockHtml);

        expect(res.qtd).toBe(40);
        expect(res.imoveis).toHaveLength(1);
        expect(res.imoveis[0].titulo).toBe('Apartamento - Centro');
        expect(res.imoveis[0].valor).toBe(500000);
        expect(res.imoveis[0].quartos).toBe(2);
        expect(res.imoveis[0].banheiros).toBe(1);
        expect(res.imoveis[0].vagas).toBe(2);
        expect(res.imoveis[0].endereco).toBe('CENTRO');
        expect(res.imoveis[0].link).toBe('https://www.francaimoveis.net/details/apartamento/123');
        expect(res.imoveis[0].imagens).toEqual(['https://www.francaimoveis.net/img/foto.jpg']);
    });

    it('a ultima pagina e o maior numero dos links (o ultimo link e "Proximo")', async () => {
        const html = '<ul class="search-pageing pagination"><li><a href="#">Anterior</a></li><li><a href="#">1</a></li><li><a href="#2">2</a></li><li><a href="#3">3</a></li><li><a href="#2">Proximo</a></li></ul>';
        // Sem cartoes o total cai para 0 de qualquer forma: so o calculo da ultima pagina importa aqui.
        const res = await francaimoveis.adapter(html);
        expect(res.qtd).toBe(60);
    });

    it('pagina por POST de formulario: o numero da pagina vai no payload, nao na URL', () => {
        expect(francaimoveis.driver).toBe('axios_rest');
        expect(francaimoveis.method).toBe('POST');
        expect(francaimoveis.getPaginateParams(3)).toEqual({ url: 'https://www.francaimoveis.net/imoveis/a-venda/franca', payload: { page: 3, order: 'destaque' } });
    });
});
