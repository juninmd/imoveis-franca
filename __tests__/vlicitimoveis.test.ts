import vlicitimoveis from '../src/sites/vlicitimoveis';

describe('Vlicit Imoveis', () => {
    it('should parse the payload correctly', async () => {
        const mockHtml = `
          <div class="LI_ImovelInner">
            <a class="Title" href="/imovel/123">Casa com Piscina</a>
            <div class="BoxValores">
                <div class="ImovelValor"><span class="Valor">R$ 500.000</span></div>
            </div>
            <img class="BannerImage" src="/img/casa.jpg" />
            <span class="Endereco">Rua Teste, Franca, Brasil</span>
            <span class="Resumo">
                <span class="ResumoItem">Útil: 200m²</span>
            </span>
            <div class="ResumoDescritivo">
                3 quartos, 2 banheiros e 4 vagas de garagem.
            </div>
            <div class="ValorDesc">Venda</div>
          </div>
        `;

        // mock API JSON wrapper
        const jsonMock = JSON.stringify({ html: mockHtml });

        const result = await vlicitimoveis.adapter(jsonMock);
        expect(result.imoveis.length).toBe(1);
        expect(result.qtd).toBe(1);
        expect(result.imoveis[0].titulo).toBe('Casa com Piscina');
        expect(result.imoveis[0].valor).toBe(500000);
        expect(result.imoveis[0].area).toBe(200);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].banheiros).toBe(2);
        expect(result.imoveis[0].vagas).toBe(4);
        expect(result.imoveis[0].link).toBe('https://www.vlicitimoveis.com.br/imovel/123');
        expect(result.imoveis[0].endereco).toBe('Rua Teste, Franca');
        expect(result.imoveis[0].tipo).toBe('venda');
    });

    it('should return valid pagination config', () => {
        const config = vlicitimoveis.getPaginateParams(1);
        expect(config.path).toContain('busca');
        expect(config.params?.method).toBe('POST');
    });
});
