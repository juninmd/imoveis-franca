import { adapter as remapAdapter } from '../src/sites/imoveisremap';
import { adapter as projetoAdapter } from '../src/sites/projetoimoveisfranca';


describe('imoveisremap.com.br', () => {
    it('should parse kenlo schema format correctly', async () => {
        const html = `
        <html>
            <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "numberOfItems": 1,
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item": {
                    "@type": "RealEstateListing",
                    "name": "Casa de 82 m² Villagio Mundo Novo - Franca, à venda por R$ 405.000",
                    "url": "https://www.imoveisremap.com.br/imovel/CA1047-REN3",
                    "address": {
                      "@type": "PostalAddress",
                      "addressLocality": "Franca",
                      "addressRegion": "SP"
                    },
                    "image": ["https://img.kenlo.io/image.jpg"],
                    "offers": {
                      "@type": "Offer",
                      "price": 405000,
                      "priceCurrency": "BRL"
                    }
                  }
                }
              ]
            }
            </script>
            <body>
                <a href="/imovel/CA1047-REN3">Ver mais</a>
                <div>2 quartos, 1 suíte, 2 vagas, 82 m²</div>
            </body>
        </html>`;

        const result = await remapAdapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].titulo).toBe('Casa de 82 m² Villagio Mundo Novo - Franca, à venda por R$ 405.000');
        expect(result.imoveis[0].valor).toBe(405000);
        expect(result.imoveis[0].endereco).toBe('FRANCA');
        expect(result.imoveis[0].quartos).toBe(2);
        expect(result.imoveis[0].area).toBe(82);
    });

    it('should handle missing JSON gracefully', async () => {
        const html = `<html><body><div></div></body></html>`;
        const result = await remapAdapter(html);
        expect(result.imoveis.length).toBe(0);
        expect(result.qtd).toBe(0);
    });

    it('should handle broken JSON gracefully', async () => {
        const html = `<html><script type="application/ld+json">{"@type": "ItemList", </script></body></html>`;
        const result = await remapAdapter(html);
        expect(result.imoveis.length).toBe(0);
        expect(result.qtd).toBe(0);
    });
});

describe('projetoimoveisfranca.com.br', () => {
    it('should parse recent-properties-box format correctly', async () => {
        const html = `
        <html>
            <body>
                <div class="recent-properties-box">
                    <span class="tag-s">Venda</span>
                    <h3 class="title"><a href="/imovel/123">Linda Casa</a></h3>
                    <div class="location">Jardim Noêmia, Franca</div>
                    <div class="price">R$ 550.000,00</div>
                    <ul class="facilities-list">
                        <li><i class="flaticon-bed"></i> 3</li>
                        <li><i class="flaticon-holidays"></i> 2</li>
                        <li><i class="flaticon-vehicle"></i> 2</li>
                    </ul>
                    <img class="img-responsive" src="/assets/img/casa.jpg" />
                </div>
            </body>
        </html>`;

        const result = await projetoAdapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].titulo).toBe('Linda Casa');
        expect(result.imoveis[0].valor).toBe(550000);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].banheiros).toBe(2);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].endereco).toBe('JARDIM NOEMIA');
    });

    it('should ignore rentals', async () => {
        const html = `
        <html>
            <body>
                <div class="recent-properties-box">
                    <span class="tag-s">Aluguel</span>
                    <h3 class="title"><a href="/imovel/123">Linda Casa</a></h3>
                    <div class="price">R$ 5.000,00</div>
                </div>
            </body>
        </html>`;

        const result = await projetoAdapter(html);
        expect(result.imoveis.length).toBe(0);
    });
});
