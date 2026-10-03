import imoveisemfranca from '../src/sites/imoveisemfranca';

describe('imoveisemfranca.com.br scraper', () => {
    it('should have correct basic info', () => {
        expect(imoveisemfranca.name).toBe('imoveisemfranca.com.br');
        expect(imoveisemfranca.driver).toBe('axios');
        expect(imoveisemfranca.enabled).toBe(true);
        expect(imoveisemfranca.getPaginateParams(1)).toEqual({ path: 'https://portal.maxmasimob.com.br/cidade/franca-sp?page=1' });
    });

    it('should adapter properly parse HTML', async () => {
        const html = `
            <div class="card">
                <a class="card-btn" href="/imovel/123">Link</a>
                <img src="/img/123.jpg" />
                <div class="card-preco">R$ 1.500.000,00</div>
                <div class="card-tipo">Casa</div>
                <div class="card-end">Rua A</div>
                <div class="card-bairro">Bairro B</div>
                <div class="card-info">
                    <span>150 m²</span>
                    <span>3 dorms</span>
                    <span>2 suítes</span>
                    <span>2 vagas</span>
                </div>
            </div>
            <div class="card">
                <!-- missing price / link should be handled -->
            </div>
        `;
        const res = await imoveisemfranca.adapter(html);
        expect(res.imoveis.length).toBe(1);
        const imovel = res.imoveis[0];
        expect(imovel.titulo).toBe('Casa');
        expect(imovel.valor).toBe(1500000);
        expect(imovel.area).toBe(150);
        expect(imovel.quartos).toBe(3);
        expect(imovel.banheiros).toBe(2);
        expect(imovel.vagas).toBe(2);
        expect(imovel.endereco).toBe('Rua A - Bairro B');
        expect(imovel.imagens).toEqual(['https://www.imoveisemfranca.com.br/img/123.jpg']);
        expect(imovel.link).toBe('https://www.imoveisemfranca.com.br/imovel/123');
        expect(res.qtd).toBe(100);
    });

    it('should handle adapter properly parse HTML missing details', async () => {
        const html = `
            <div class="card">
                <a class="card-btn" href="https://other.com">Link</a>
                <img src="https://other.com/img/123.jpg" />
                <div class="card-preco">Consulte</div>
            </div>
            <div class="card">
                <a class="card-btn" href="https://other.com">Link</a>
                <img src="https://other.com/img/123.jpg" />
                <div class="card-preco">R$ 200,00</div>
            </div>
        `;
        const res = await imoveisemfranca.adapter(html);
        expect(res.imoveis.length).toBe(1);
        const imovel = res.imoveis[0];
        expect(imovel.titulo).toBe('Imóvel');
        expect(imovel.valor).toBe(200);
        expect(imovel.area).toBe(0);
        expect(imovel.quartos).toBe(0);
        expect(imovel.banheiros).toBe(0);
        expect(imovel.vagas).toBe(0);
        expect(imovel.endereco).toBe('');
        expect(imovel.imagens).toEqual(['https://other.com/img/123.jpg']);
        expect(imovel.link).toBe('https://other.com');
    });
});
