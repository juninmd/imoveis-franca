import { adapter } from '../src/sites/salimimobiliaria';

describe('salimimobiliaria adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <div class="resultados clearfix">
        <span class="num">7</span> imóveis  encontrados
      </div>
      <ul class="iset igrid ipl4 ipl4-ul clearfix use-flickity">
        <li class="col-im-grid col-xs-12 col-sm-6 col-md-6 col-lg-4 col-xl-4 col-ul-3 venda residencia fav-star" id="im-1-ref-30">
          <div class="item icons1">
            <a href="/imovel/casa-franca-cidade-nova-4-quartos-3-garagens-venda-ref-30/" class="main tTip" title="CASA ALTO PADRAO PROXIMA AO PESTALOZI FRANCA SP - Pronto para morar">
              <figure><img data-src="//b2.casteldigital.com.br/andersonsalimimoveis/ig/icp/imoveis/30/img.jpg" class="lozad" alt=""></figure>
              <div class="middle">
                <div class="info">
                  <p class="cidade skiptranslate"><i class="fa fa-map-marker icon"></i> Franca - <span class="bairro">Cidade Nova</span></p>
                  <div class="tipo">Casa</div>
                  <div class="icones">
                    <span class="dorms dado tTip" title="4 dormitorios"><em>4</em></span>
                    <span class="bwcs dado tTip" title="4 banheiros"><em>4</em></span>
                    <span class="vagas dado tTip" title="3 vagas"><em>3</em></span>
                    <span class="area-total area dado tTip" title="area total 300,00m2"><em>300,<span class="cent dzero">00</span> </em></span>
                  </div>
                </div>
              </div>
            </a>
            <div class="bottom">
              <div class="preco skiptranslate">
                <p><span class="promo real tTip" title="de R$ 1.100.000 por R$ 990.000">
                  <span class="valor de"> R$ 1.100.000</span>
                  <span class="valor por"> R$ 990.000,<span class="cent dzero">00</span></span>
                </span></p>
              </div>
            </div>
          </div>
        </li>
      </ul>
    `;

    const result = await adapter(html);
    expect(result.qtd).toBe(7);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].valor).toBe(990000);
    expect(result.imoveis[0].quartos).toBe(4);
    expect(result.imoveis[0].banheiros).toBe(4);
    expect(result.imoveis[0].vagas).toBe(3);
    expect(result.imoveis[0].area).toBe(300);
    expect(result.imoveis[0].endereco).toBe('CIDADE NOVA');
    expect(result.imoveis[0].imagens[0]).toBe('https://b2.casteldigital.com.br/andersonsalimimoveis/ig/icp/imoveis/30/img.jpg');
    expect(result.imoveis[0].link).toBe('https://www.salimimobiliaria.com.br/imovel/casa-franca-cidade-nova-4-quartos-3-garagens-venda-ref-30/');
  });

  it('should parse a non-promotional price and default qtd from item count', async () => {
    const html = `
      <ul class="iset igrid ipl4 ipl4-ul clearfix use-flickity">
        <li class="col-im-grid venda residencia fav-star" id="im-2-ref-58">
          <div class="item icons1">
            <a href="/imovel/casa-franca-sao-jose-venda-ref-58/" class="main tTip" title="CASA MODERNA">
              <figure><img data-src="//b2.casteldigital.com.br/img/58.jpg" class="lozad" alt=""></figure>
              <div class="middle">
                <div class="info">
                  <p class="cidade skiptranslate"><i class="fa fa-map-marker icon"></i> Franca - <span class="bairro">Sao Jose</span></p>
                  <div class="icones">
                    <span class="dorms dado tTip"><em>3</em></span>
                    <span class="bwcs dado tTip"><em>3</em></span>
                    <span class="vagas dado tTip"><em>4</em></span>
                    <span class="area-total area dado tTip"><em>275,<span class="cent dzero">00</span> </em></span>
                  </div>
                </div>
              </div>
            </a>
            <div class="bottom">
              <div class="preco skiptranslate"><p>R$ 589.000,<span class="cent dzero">00</span></p></div>
            </div>
          </div>
        </li>
      </ul>
    `;

    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].valor).toBe(589000);
    expect(result.qtd).toBe(1);
  });

  it('should handle zero properties', async () => {
    const html = `<div class="resultados clearfix"></div>`;
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });
});
