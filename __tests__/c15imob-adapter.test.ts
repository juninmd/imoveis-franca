import c15imob, { adapter } from '../src/sites/c15imob';

describe('c15imob adapter', () => {
    it('should parse properties correctly', async () => {
        // Create a mock HTML
        const html = `
        <a href="https://www.c15imob.com.br/imovel/teste/123" class="meuLink">
            <div class="link-card-imovel">
                <h2 class="card-title">Casa de Teste</h2>
                <div class="container-endereco"><span class="card-text">Centro | Franca</span></div>
                <div class="preco-imovel-card"><strong>R$ 500.000,00</strong></div>
                <div class="carousel-item"><img src="http://img.com/test.jpg" /></div>
                <div class="container-icon">
                    <span class="card_imovel_color">100 m²</span>
                    <span>área</span>
                </div>
                <div class="container-icon">
                    <span class="card_imovel_color">3</span>
                    <span>quartos</span>
                </div>
                <div class="container-icon">
                    <span class="card_imovel_color">2</span>
                    <span>banheiros</span>
                </div>
                <div class="container-icon">
                    <span class="card_imovel_color">1</span>
                    <span>vaga</span>
                </div>
            </div>
        </a>
        <a href="https://www.c15imob.com.br/imovel/teste/124" class="meuLink">
            <div class="link-card-imovel">
                <h2 class="card-title"></h2>
                <div class="container-endereco"><span class="card-text">Centro | Franca</span></div>
                <div class="preco-imovel-card"><strong>R$ 0,00</strong></div>
                <div class="carousel-item"><img data-src="http://img.com/test2.jpg" /></div>
            </div>
        </a>
        <a class="meuLink">
            <div class="link-card-imovel">
                <div class="preco-imovel-card"><strong>R$ 100.000,00</strong></div>
            </div>
        </a>
        <a href="https://www.c15imob.com.br/imovel/teste/125" class="meuLink">
            <div class="link-card-imovel">
                <div class="container-icon">
                    <span class="card_imovel_color"></span>
                    <span></span>
                </div>
                 <div class="preco-imovel-card"><strong>R$ 100.000,00</strong></div>
            </div>
        </a>
        `;

        const result = await adapter(html);
        expect(result.imoveis).toHaveLength(2);
        expect(result.imoveis[0]).toMatchObject({
            titulo: 'Casa de Teste',
            endereco: 'CENTRO',
            valor: 500000,
            area: 100,
            areaTotal: 100,
            quartos: 3,
            banheiros: 2,
            vagas: 1,
            link: 'https://www.c15imob.com.br/imovel/teste/123',
            imagens: ['http://img.com/test.jpg'],
            precoPorMetro: 5000,
            site: 'c15imob.com.br',
            entrada: 100000
        });
    });

    it('should calculate pagination params', () => {
        expect(c15imob.getPaginateParams(1)).toEqual({ url: 'https://c15imob.com.br/venda' });
        expect(c15imob.getPaginateParams(2)).toEqual({ url: 'https://c15imob.com.br/venda?pag=2' });
    });
});
