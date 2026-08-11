import { adapter as cintraAdapter } from '../src/sites/cintraimoveis';
import { adapter as tratoAdapter } from '../src/sites/tratoimoveis';
import { adapter as faleirosAdapter } from '../src/sites/faleirosimoveis';

describe('Novos sites', () => {
  it('cintraimoveis', async () => {
    const html = `<h1 class="list-total">1 imóveis à venda encontrados</h1>
    <div class="resultado_novo">
      <a href="/comprar/sp/franca/centro/casa/123" class="botao_ver_mais">Ver</a>
      <div class="titulo_novo">CASA</div>
      <div class="bairro_novo">Centro</div>
      <div class="valor_novo"><h5>R$ 300.000,00</h5></div>
      <div class="icone_lista_novo">2 dorms</div>
      <div class="icone_lista_novo">1 vaga</div>
      <div class="icone_lista_novo">1 banh</div>
      <div class="icone_lista_novo">100m²</div>
      <div class="swiper-slide"><img src="img.jpg"></div>
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
    const html = `<h1>1 imóveis</h1>
    <div class="item">
      <a href="imovel/123">Link</a>
      CASA
      Centro
      R$ 400.000,00
      <li title="2 quartos"></li>
      <li title="100 m²"></li>
      <img src="img.jpg">
    </div>`;
    const res = await faleirosAdapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].valor).toBe(400000);
    expect(res.imoveis[0].area).toBe(100);
    expect(res.qtd).toBe(1);
  });
});
