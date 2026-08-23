import imobiliariaplano from '../src/sites/imobiliariaplano';

describe('imobiliariaplano coverage', () => {
    it('should extract correctly', async () => {
        const res = await imobiliariaplano.adapter('');
        expect(res.imoveis).toHaveLength(0);

        const html = `
          <body>
            402 Imóveis encontrados
            <div class="card">
              <h2>Casa - Centro</h2>
              <b>R$ 250.000,00</b>
              <div>150 m²</div>
              <div>3 quartos</div>
              <div>2 banh</div>
              <div>2 vagas</div>
              <a href="/imovel/123">Link</a>
              <img src="/img.jpg" />
            </div>
            <div class="imovel">
              <h3 class="titulo">Apt - Jd Lima</h3>
              <span>R$ 150.000,00</span>
              <a href="http://link2"></a>
            </div>
            <div class="property">
              <div class="title">a</div>
            </div>
            <div class="card">
                <h2>Casa Jd Alvorada</h2>
                <b>R$ 350.000,00</b>
                <div>3 dorm</div>
                <div>2 wc</div>
                <div>3 garagem</div>
                <a href="/imovel/124">Link</a>
            </div>
          </body>
        `;
        const result = await imobiliariaplano.adapter(html);
        expect(result.qtd).toBe(402);
        expect(result.imoveis.length).toBeGreaterThan(0);

        expect(imobiliariaplano.getPaginateParams(2)).toEqual({
            url: 'https://www.imobiliariaplano.com.br/venda/imoveis/todas-as-cidades/todos-os-bairros/0-quartos/0-suite-ou-mais/0-vaga/0-banheiro-ou-mais/todos-os-condominios?valorminimo=0&valormaximo=0&pagina=2'
        });
    });
});
