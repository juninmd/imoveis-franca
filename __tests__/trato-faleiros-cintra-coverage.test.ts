import { adapter as cintraAdapter } from '../src/sites/cintraimoveis';
import { adapter as tratoAdapter } from '../src/sites/tratoimoveis';
import { adapter as faleirosAdapter } from '../src/sites/faleirosimoveis';

describe('Coverage for new sites', () => {
  it('cintraimoveis edge cases', async () => {
    // missing img, missing values, different specs
    const html = `<div class="resultado_novo">
      <a href="/sem-link" class="botao_ver_mais">Ver</a>
      <div class="titulo_novo"></div>
      <div class="valor_novo"><h5>Venda 0</h5></div>
      <div class="icone_lista_novo">2 vaga</div>
    </div>
    <div class="resultado_novo">
      <a href="/imovel/123" class="botao_ver_mais">Ver</a>
      <div class="titulo_novo">CASA 2</div>
      <div class="bairro_novo"></div>
      <div class="valor_novo"><h5>R$ 300.000,00</h5></div>
      <div class="icone_lista_novo">0 m²</div>
      <div class="icone_lista_novo">0 dorm</div>
      <div class="icone_lista_novo">0 banh</div>
      <div class="icone_lista_novo">0 vaga</div>
    </div>
    <div class="resultado_novo">
    </div>`;
    const res = await cintraAdapter(html);
    expect(res.imoveis.length).toBe(1);
    expect(res.imoveis[0].precoPorMetro).toBe(0);
    expect(res.imoveis[0].endereco).toBe('CENTRO');

    const html2 = ``;
    const res2 = await cintraAdapter(html2);
    expect(res2.qtd).toBe(0);
  });

  it('tratoimoveis edge cases', async () => {
    const html = `<div class="row imovel">
       <a></a>
    </div>
    <div class="row imovel">
      <a href="/imovel/123">Link</a>
      <h5 class="v4-custom-h5">R$ 0,00</h5>
      <h5>CASA</h5>
    </div>
    <div class="row imovel">
      <a href="/imovel/123">Link</a>
      <h5 class="v4-custom-h5">R$ 200.000,00</h5>
      <h5>CASA</h5>
      <h5></h5>
      <p class="v4-custom-p">0 Quartos</p>
      <p class="v4-custom-p">0 Banheiro</p>
      <p class="v4-custom-p">0 Área</p>
      <p class="v4-custom-p">0 Vaga</p>
    </div>
    <div class="row imovel">
       <a href="/imovel/124">Link</a>
       R$ 300.000,00
       CASA
       Centro
    </div>
    `;
    const res = await tratoAdapter(html);
    expect(res.imoveis.length).toBe(2);

    const res2 = await tratoAdapter('');
    expect(res2.qtd).toBe(0);
  });

  it('faleirosimoveis edge cases', async () => {
    const html = `<div class="item">
      <a href="imovel/123">Link</a>
      R$ 0,00
    </div>
    <div class="item">
      <a href="imovel/123">Link</a>
      R$ 200.000,00
      <li title="0 quartos"></li>
      <li title="0 m²"></li>
      <li title="0 banh"></li>
      <li title="0 vaga"></li>
    </div>
    <div class="item">
    </div>`;
    const res = await faleirosAdapter(html);
    expect(res.imoveis.length).toBe(1);

    const res2 = await faleirosAdapter('');
    expect(res2.qtd).toBe(0);
  });
});
