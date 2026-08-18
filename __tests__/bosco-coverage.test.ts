import { adapter } from '../src/sites/boscoimoveis';
import site from '../src/sites/boscoimoveis';

describe('boscoimoveis adapter coverage', () => {
  it('should parse correctly without link or without title', async () => {
    const html = `
    <body>
       <span class="hidden-xs">Listagem de Imóveis - Exibindo de 1 a 12 de <b>0</b></span>
       <div class="row">
           <div class="col-lg-4 col-md-4 col-sm-6 wow fadeInUp delay-03s">
                <div class="thumbnail recent-properties-box">
                    <div class="caption detail">
                        <header class="clearfix">
                            <div class="pull-left">
                                <h1 class="title">
                                </h1>
                            </div>
                            <div class="price">R$ 150.000,00</div>
                        </header>
                        <h3 class="location">
                        </h3>
                        <ul class="facilities-list clearfix">
                            <li><span>2 Quarto(s)</span></li>
                            <li><span>1 Banh(s)</span></li>
                            <li><span>2 Vaga(s)</span></li>
                            <li><span>100 m²</span></li>
                        </ul>
                    </div>
                </div>
           </div>

           <div class="col-lg-4 col-md-4 col-sm-6 wow fadeInUp delay-03s">
                <div class="thumbnail recent-properties-box">
                    <a href="http://link.com"></a>
                    <div class="caption detail">
                        <header class="clearfix">
                            <div class="pull-left">
                                <h1 class="title">
                                    <a href="http://link.com"></a>
                                </h1>
                            </div>
                            <div class="price">R$ 150.000,00</div>
                        </header>
                        <h3 class="location">
                        </h3>
                        <ul class="facilities-list clearfix">
                        </ul>
                    </div>
                </div>
           </div>

       </div>
    </body>
    `;

    const result = await adapter(html);
    expect(result.qtd).toBe(1); // 1 valid because second has link and value > 0
    expect(result.imoveis).toHaveLength(1);
    expect(result.imoveis[0].titulo).toBe('Imóvel');
  });

  it('should parse correctly when img src starts with http', async () => {
    const html = `
    <body>
       <div class="row">
           <div class="col-lg-4 col-md-4 col-sm-6 wow fadeInUp delay-03s">
                <div class="thumbnail recent-properties-box">
                    <a href="/imovel">
                        <img src="http://img.com/a.jpg" alt="VENDE">
                    </a>
                    <div class="caption detail">
                        <header class="clearfix">
                            <div class="pull-left">
                                <h1 class="title">
                                    <a href="/imovel">VENDE</a>
                                </h1>
                            </div>
                            <div class="price">R$ 150.000,00</div>
                        </header>
                    </div>
                </div>
           </div>

           <div class="col-lg-4 col-md-4 col-sm-6 wow fadeInUp delay-03s">
                <div class="thumbnail recent-properties-box">
                    <a href="/imovel">
                        <img src="/img/a.jpg" alt="Other">
                    </a>
                    <div class="caption detail">
                        <header class="clearfix">
                            <div class="pull-left">
                                <h1 class="title">
                                    <a href="/imovel">OTHER</a>
                                </h1>
                            </div>
                            <div class="price">R$ 150.000,00</div>
                        </header>
                    </div>
                </div>
           </div>

           <div class="col-lg-4 col-md-4 col-sm-6 wow fadeInUp delay-03s">
                <div class="thumbnail recent-properties-box">
                    <a href="/imovel">
                    </a>
                    <div class="caption detail">
                        <header class="clearfix">
                            <div class="pull-left">
                                <h1 class="title">
                                    <a href="/imovel">Test</a>
                                </h1>
                            </div>
                            <div class="price">R$ 150.000,00</div>
                        </header>
                    </div>
                </div>
           </div>
       </div>
    </body>
    `;

    const result = await adapter(html);
    expect(result.qtd).toBe(3);
    expect(result.imoveis).toHaveLength(3);
    expect(result.imoveis[0].imagens).toEqual(['http://img.com/a.jpg']);
    expect(result.imoveis[0].titulo).toEqual('VENDE'); // since img alt is VENDE, we want to test when title is VENDE
    expect(result.imoveis[1].imagens).toEqual(['https://www.boscoimoveis.com.br/img/a.jpg']);
    expect(result.imoveis[1].titulo).toEqual('OTHER');
    expect(result.imoveis[2].imagens).toEqual([]);

    // tests for facilities to increase branch coverage
    expect(result.imoveis[0].quartos).toBe(0);
    expect(result.imoveis[0].area).toBe(0);
  });

  it('qtdMatch from Listagem de Imoveis', async () => {
      const html = `<body><span class="hidden-xs">Listagem de Imóveis - Exibindo de 1 a 12 de <b>5</b></span></body>`;
      const result = await adapter(html);
      expect(result.qtd).toBe(5);
  });

  it('qtdMatch from de X imóveis', async () => {
      const html = `<body>de 5 imóveis</body>`;
      const result = await adapter(html);
      expect(result.qtd).toBe(5);
  });

  it('qtdMatch fallback body text', async () => {
      const html = `<body>de 5 </body>`;
      const result = await adapter(html);
      expect(result.qtd).toBe(5);
  });

  it('getPaginateParams returns correct format', () => {
      expect(site.getPaginateParams(2)).toEqual({ url: 'https://www.boscoimoveis.com.br/imoveis/finalidade-2-comprar/pagina-2' });
  });

  it('fallback when Listagem de Imoveis exists but no bold text inside', async () => {
      const html = `<body><span class="hidden-xs">Listagem de Imóveis</span></body>`;
      const result = await adapter(html);
      expect(result.qtd).toBe(0);
  });

  it('match regex 4 Exibindo de X a Y de Z', async () => {
      const html = `<body>Exibindo de 1 a 12 de 5</body>`;
      const result = await adapter(html);
      expect(result.qtd).toBe(5);
  });

  it('match regex Exibindo de X a Y de Z ignoring spaces', async () => {
      const html = `<body>Exibindo de 1 a 12 de    5</body>`;
      const result = await adapter(html);
      expect(result.qtd).toBe(5);
  });
});
