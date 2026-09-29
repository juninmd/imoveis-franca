import fortscunha, { adapter } from '../src/sites/fortscunha';

describe('Forts Cunha Site', () => {
    it('should export site config', () => {
        expect(fortscunha.name).toBe('fortscunha.com.br');
        // getPaginateParams returns any for now so we cast to check
        expect((fortscunha.getPaginateParams(2) as any).url).toContain('page=2');
    });

    it('should parse html correctly', async () => {
        const html = `
        <div class="pagination">
            <ul>
                <li><a href="1">1</a></li>
                <li><a href="2">2</a></li>
                <li><a href="3">3</a></li>
                <li><a href=">">></a></li>
            </ul>
        </div>
        <div class="single-project">
            <h5><a href="https://example.com/imovel">Casa Linda</a></h5>
            <div class="lower-content">Franca - Centro\nMais info</div>
            <img src="image.jpg" />
            <div class="valor-pacote">R$ 500.000,00</div>
            <div class="valores-imovel"><i class="fa fa-bed"></i> 3</div>
            <div class="valores-imovel"><i class="fa fa-bath"></i> 2</div>
            <div class="valores-imovel"><i class="fa fa-car"></i> 1</div>
            <div class="valores-imovel"><i class="fa fa-arrows"></i> 150</div>
        </div>
        <div class="single-project">
            <h5><a>Casa Feia</a></h5>
            <div class="lower-content">Sem Local\n</div>
            <img />
            <div class="valor-pacote">Consulte</div>
            <div class="valores-imovel">0</div>
        </div>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(36);
        expect(res.imoveis.length).toBe(1);
        expect(res.imoveis[0].titulo).toBe('Casa Linda em Centro');
        expect(res.imoveis[0].quartos).toBe(3);
        expect(res.imoveis[0].banheiros).toBe(2);
        expect(res.imoveis[0].vagas).toBe(1);
        expect(res.imoveis[0].area).toBe(150);
        expect(res.imoveis[0].valor).toBe(500000);
        expect(res.imoveis[0].precoPorMetro).toBe(500000 / 150);
    });

    it('should fallback to elements count if pagination fails', async () => {
        const html = `
        <div class="pagination">
            <ul>
                <li><a href="1">Not a number</a></li>
                <li><a href=">">></a></li>
            </ul>
        </div>
        <div class="single-project">
            <h5><a href="https://example.com/imovel">Casa Linda</a></h5>
            <div class="lower-content">Franca - Centro\nMais info</div>
            <div class="valor-pacote">R$ 500.000,00</div>
            <img src="test"/>
            <div class="valores-imovel">3</div>
        </div>
        <div class="single-project">
            <h5><a href="https://example.com/imovel2">Casa 2</a></h5>
            <div class="lower-content">Sem traco</div>
            <div class="valor-pacote">R$ 500.000,00</div>
            <img src="test"/>
        </div>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(2);
    });

    it('should handle zero area properly', async () => {
        const html = `
        <div class="single-project">
            <h5><a href="https://example.com/imovel">Casa Linda</a></h5>
            <div class="lower-content">Franca - Centro</div>
            <div class="valor-pacote">R$ 500.000,00</div>
            <img src="test"/>
        </div>
        `;
        const res = await adapter(html);
        expect(res.imoveis[0].precoPorMetro).toBe(0);
        expect(res.imoveis[0].area).toBe(0);
    });
});
