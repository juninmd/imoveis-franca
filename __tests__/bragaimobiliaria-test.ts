import { adapter } from '../src/sites/bragaimobiliaria';

describe('bragaimobiliaria adapter', () => {
    it('should parse properties correctly', async () => {
        const html = `
        <div class="recent-properties-box">
            <h3 class="location"><a href="link1">Endereço Teste, Franca</a></h3>
            <span class="tag-f"><a href="#">Vende Casa</a></span>
            <div class="price">R$ 500.000,00</div>
            <img src="/img1.jpg" />
            <img src="logo.png" />
            <ul class="facilities-list">
                <li>3 quarto</li>
                <li>2 banheiro</li>
                <li>1 vaga</li>
                <li>100 m²</li>
            </ul>
        </div>
        <div class="recent-properties-box">
            <h3 class="location"><a href="link2">Endereço Sem Preço, Franca</a></h3>
            <span class="tag-f"><a href="#">Vende Apartamento</a></span>
            <div class="price">Consulte-nos</div>
        </div>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(1);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0]).toEqual({
            titulo: 'Vende Casa',
            descricao: '',
            imagens: ['https://www.bragaimobiliaria.com.br//img1.jpg'],
            endereco: 'ENDERECO TESTE',
            valor: 500000,
            area: 100,
            areaTotal: 100,
            quartos: 3,
            banheiros: 2,
            vagas: 1,
            link: 'link1',
            precoPorMetro: 5000,
            site: 'bragaimobiliaria.com.br',
            entrada: 100000
        });
    });

    it('should return empty if html is empty', async () => {
        const result = await adapter('');
        expect(result.qtd).toBe(0);
        expect(result.imoveis).toHaveLength(0);
    });
});
