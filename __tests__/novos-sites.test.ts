import { adapter as cintraAdapter } from '../src/sites/cintraimoveis';
import { adapter as tratoAdapter } from '../src/sites/tratoimoveis';
import { adapter as faleirosAdapter } from '../src/sites/faleirosimoveis';

describe('Novos sites', () => {
  it('cintraimoveis', async () => {
    const html = `<h1 class="list-total">1 imóveis à venda encontrados</h1>
    <div class="resultado_novo">
      <a href="/comprar/sp/franca/centro/casa/123" class="botao_ver_mais">Ver</a>
      <div class="titulo_novo">CASA</div>
      <div class="valor_novo"><h5>R$ 300.000,00</h5></div>
      <div class="detalhe_novo">2 quartos</div>
      <div class="detalhe_novo">1 vaga</div>
      <div class="detalhe_novo">1 banh</div>
      <div class="detalhe_novo">100m²</div>
      <div class="swiper-slide"><img src="img.jpg"></div>
      <div class="final_card"><span>Centro - Franca/SP</span></div>
    </div>`;
    const res = await cintraAdapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].valor).toBe(300000);
    expect(res.imoveis[0].area).toBe(100);
    expect(res.qtd).toBe(1);
  });

  it('tratoimoveis', async () => {
    const html = `<h1>1 imóveis</h1>
    <div class="row imovel">
      <a href="/imovel/123">Link</a>
      <h5 class="v4-custom-h5">R$ 200.000,00</h5>
      <h5>CASA</h5>
      <h5>Centro</h5>
      <p class="v4-custom-p">2 Quartos</p>
      <p class="v4-custom-p">1 Banheiro</p>
      <p class="v4-custom-p">100 Área</p>
      <div class="swiper-slide"><img src="img.jpg"></div>
    </div>`;
    const res = await tratoAdapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].valor).toBe(200000);
    expect(res.imoveis[0].area).toBe(100);
    expect(res.qtd).toBe(1);
  });

  it('faleirosimoveis', async () => {
    const html = `<div class="pagesNav">Resultado(s) <b>1</b> - <b>1</b> de <b>1</b> resultados</div>
    <div class="lista-imoveis">
      <dl class="gridTypeList">
        <dd class="foto-lista"><a href="/detalhes-imovel/123-casa-venda-centro.html"><img class="lazyload" data-src="img.jpg" alt="Casa"></a></dd>
        <dd class="det-lista"><strong><a title="Casa" href="/detalhes-imovel/123-casa-venda-centro.html">Casa</a></strong>
          <span class="loc notranslate"><b>Centro</b> / <b>Franca - SP</b></span>
        </dd>
        <dd class="pr-lista"><span class="valorImovel radius"><small class="pr-prefixo">Venda</small><b class="notranslate">R$ 400.000,00</b></span></dd>
        <div class="caracts-bottom">
          <span><small>Dormitórios</small><b>2</b></span>
          <span><small>Área</small><b>100</b></span>
        </div>
      </dl>
    </div>`;
    const res = await faleirosAdapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].valor).toBe(400000);
    expect(res.imoveis[0].area).toBe(100);
    expect(res.qtd).toBe(1);
  });
});
