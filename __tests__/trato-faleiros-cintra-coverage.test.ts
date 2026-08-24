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
      <div class="detalhe_novo">2 vaga</div>
    </div>
    <div class="resultado_novo">
      <a href="/imovel/123" class="botao_ver_mais">Ver</a>
      <div class="titulo_novo">CASA 2</div>
      <div class="final_card"></div>
      <div class="valor_novo"><h5>R$ 300.000,00</h5></div>
      <div class="detalhe_novo">0 m²</div>
      <div class="detalhe_novo">0 dorm</div>
      <div class="detalhe_novo">0 banh</div>
      <div class="detalhe_novo">0 vaga</div>
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
    const html = `<div class="col-md-12 linkImovel">
      <a href="/imoveis/toDo/view/item/1607946303">
        <div class="row imovel" style="padding:0;border-radius: 10px">
          <div class="col-md-12 thumbImovel">
            <div class="swiper-container swiper">
              <div class="swiper-wrapper">
                <div class="swiper-slide">
                  <img src="https://okeimoveis.com.br/uploads/img1.jpg" class="w-100">
                </div>
              </div>
            </div>
          </div>
          <div class="row enderecoImovel">
            <div class="col-md-12">
              <h5 class="v4-custom-h5">Excelente Sobrado de Luxo, Jd. Triangulo</h5>
              <p class="v4-custom-p"><i class="fas fa-map-marker-alt"></i> Jardim Triângulo</p>
            </div>
          </div>
          <div class="row dadosImovel">
            <div class="col-md-4 v4-custom-p">Banheiros <br><i class="fas fa-bath"></i> 2</div>
            <div class="col-md-4 v4-custom-p">Quartos <br><i class="fas fa-bed"></i> 4</div>
            <div class="col-md-4 v4-custom-p">Área <br><i class="fas fa-ruler-combined"></i> 807.55 m²</div>
          </div>
          <div class="row">
            <div class="col-md-12" style="text-align: right">
              <h5 class="v4-custom-h5">R$ 900.000,00</h5>
            </div>
          </div>
        </div>
      </a>
    </div>
    <div class="col-md-12 linkImovel">
      <a href="/imoveis/toDo/view/item/1604578375">
        <div class="row imovel" style="padding:0;border-radius: 10px">
          <div class="row enderecoImovel">
            <div class="col-md-12">
              <h5 class="v4-custom-h5"></h5>
              <p class="v4-custom-p"><i class="fas fa-map-marker-alt"></i> Setor Nordeste</p>
            </div>
          </div>
          <div class="row dadosImovel">
            <div class="col-md-4 v4-custom-p">Banheiros <br><i class="fas fa-bath"></i></div>
            <div class="col-md-4 v4-custom-p">Quartos <br><i class="fas fa-bed"></i> 4</div>
            <div class="col-md-4 v4-custom-p">Área <br><i class="fas fa-ruler-combined"></i></div>
          </div>
          <div class="row">
            <div class="col-md-12" style="text-align: right">
              <h5 class="v4-custom-h5">R$ 0,00</h5>
            </div>
          </div>
        </div>
      </a>
    </div>
    <div class="col-md-12 linkImovel">
      <div class="row imovel" style="padding:0;border-radius: 10px">
        <a></a>
      </div>
    </div>
    `;
    const res = await tratoAdapter(html);
    expect(res.qtd).toBe(3);
    expect(res.imoveis.length).toBe(1);
    const imovel = res.imoveis[0];
    expect(imovel.titulo).toBe('Excelente Sobrado de Luxo, Jd. Triangulo');
    expect(imovel.endereco).toBe('JARDIM TRIANGULO');
    expect(imovel.valor).toBe(900000);
    expect(imovel.quartos).toBe(4);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.area).toBe(807);
    expect(imovel.imagens).toEqual(['https://okeimoveis.com.br/uploads/img1.jpg']);
    expect(imovel.link).toBe('https://www.tratoimoveis.com.br/imoveis/toDo/view/item/1607946303');

    const res2 = await tratoAdapter('');
    expect(res2.qtd).toBe(0);
  });

  it('faleirosimoveis edge cases', async () => {
    const html = `<dl class="gridTypeList">
      <dd class="foto-lista"><a href="/detalhes-imovel/1-casa-venda.html"><img data-src="img.jpg"></a></dd>
      <dd class="det-lista"><strong><a title="Casa" href="/detalhes-imovel/1-casa-venda.html">Casa</a></strong></dd>
      <dd class="pr-lista"><span class="valorImovel radius"><b class="notranslate">R$ 0,00</b></span></dd>
    </dl>
    <dl class="gridTypeList">
      <dd class="foto-lista"><a href="/detalhes-imovel/2-casa-venda.html"><img data-src="img.jpg"></a></dd>
      <dd class="det-lista"><strong><a title="Casa" href="/detalhes-imovel/2-casa-venda.html">Casa</a></strong></dd>
      <dd class="pr-lista"><span class="valorImovel radius"><b class="notranslate">R$ 200.000,00</b></span></dd>
      <div class="caracts-bottom">
        <span><small>Dormitórios</small><b>0</b></span>
        <span><small>Banheiros</small><b>0</b></span>
        <span><small>Garagens</small><b>0</b></span>
      </div>
    </dl>
    <dl class="gridTypeList">
    </dl>`;
    const res = await faleirosAdapter(html);
    expect(res.imoveis.length).toBe(1);

    const res2 = await faleirosAdapter('');
    expect(res2.qtd).toBe(0);
  });
});
