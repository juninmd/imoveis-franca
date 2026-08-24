import { adapter } from '../src/sites/carlosimoveisfranca';

describe('Carlos Imoveis Franca Adapter', () => {
  it('should parse a venda item with real price, ignore aluga and consulte-nos items', async () => {
    const html = `
      <div class="row">
        <div class="col-lg-4 col-md-4 col-sm-6">
          <div class="thumbnail recent-properties-box">
            <a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/jardim-santa-barbara/franca/terreno/364787">
              <img src="https://www.fastimob.com.br/fotos/364787.jpeg" alt="VENDE - TERRENO" class="img-responsive">
            </a>
            <div class="caption detail">
              <header class="clearfix">
                <div class="pull-left">
                  <h1 class="title">
                    <a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/jardim-santa-barbara/franca/terreno/364787">VENDE</a>
                  </h1>
                </div>
                <div class="price">R$ 70.000,00</div>
              </header>
              <h3 class="location">
                <a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/jardim-santa-barbara/franca/terreno/364787">
                  <i class="fa fa-map-marker"></i>Jardim Santa Barbara
                </a>
              </h3>
              <ul class="facilities-list clearfix">
                <li><i class="flaticon-bed"></i><span>2 Quarto(s)</span></li>
                <li><i class="flaticon-holidays"></i><span>1 Banheiro(s)</span></li>
                <li><i class="flaticon-vehicle"></i><span>1 Garagem</span></li>
              </ul>
              <div class="footer"></div>
            </div>
            <span class="tag-f"><a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/jardim-santa-barbara/franca/terreno/364787">Ver Ficha</a></span>
            <span class="tag-s"><a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/jardim-santa-barbara/franca/terreno/364787">VENDE</a></span>
          </div>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <div class="thumbnail recent-properties-box">
            <a href="https://www.carlosimoveisfranca.com.br/imovel/aluga/sp/vila-marta/franca/apartamento/365662">
              <img src="https://www.fastimob.com.br/fotos/365662.jpeg" alt="ALUGA - APARTAMENTO" class="img-responsive">
            </a>
            <div class="caption detail">
              <header class="clearfix">
                <div class="pull-left">
                  <h1 class="title">
                    <a href="https://www.carlosimoveisfranca.com.br/imovel/aluga/sp/vila-marta/franca/apartamento/365662">ALUGA</a>
                  </h1>
                </div>
                <div class="price">R$ 1.950,00</div>
              </header>
              <h3 class="location">
                <a href="https://www.carlosimoveisfranca.com.br/imovel/aluga/sp/vila-marta/franca/apartamento/365662">
                  <i class="fa fa-map-marker"></i>Vila Marta
                </a>
              </h3>
              <ul class="facilities-list clearfix">
                <li><i class="flaticon-bed"></i><span>2 Quarto(s)</span></li>
                <li><i class="flaticon-holidays"></i><span>1 Banheiro(s)</span></li>
                <li><i class="flaticon-vehicle"></i><span>1 Garagem</span></li>
              </ul>
              <div class="footer"></div>
            </div>
          </div>
        </div>
        <div class="col-lg-4 col-md-4 col-sm-6">
          <div class="thumbnail recent-properties-box">
            <a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/cidade-nova/franca/apartamento/363890">
              <img src="https://www.fastimob.com.br/fotos/363890.jpeg" alt="VENDE - APARTAMENTO" class="img-responsive">
            </a>
            <div class="caption detail">
              <header class="clearfix">
                <div class="pull-left">
                  <h1 class="title">
                    <a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/cidade-nova/franca/apartamento/363890">VENDE</a>
                  </h1>
                </div>
                <div class="price">Consulte-nos</div>
              </header>
              <h3 class="location">
                <a href="https://www.carlosimoveisfranca.com.br/imovel/vende/sp/cidade-nova/franca/apartamento/363890">
                  <i class="fa fa-map-marker"></i>Cidade Nova
                </a>
              </h3>
              <ul class="facilities-list clearfix">
                <li><i class="flaticon-bed"></i><span>0 Quarto(s)</span></li>
                <li><i class="flaticon-holidays"></i><span>5 Banheiro(s)</span></li>
                <li><i class="flaticon-vehicle"></i><span>3 Garagem</span></li>
              </ul>
              <div class="footer"></div>
            </div>
          </div>
        </div>
      </div>
      <nav aria-label="Page navigation">
        <ul class="pagination">
          <li class="active"><a href="imoveis/a-venda//pagina-1">1</a></li>
          <li><a href="imoveis/a-venda//pagina-2">2</a></li>
          <li><a href="imoveis/a-venda//pagina-3">3</a></li>
        </ul>
      </nav>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(36);
    expect(result.imoveis).toHaveLength(1);

    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('TERRENO - Jardim Santa Barbara');
    expect(imovel.valor).toBe(70000);
    expect(imovel.endereco).toBe('JARDIM SANTA BARBARA');
    expect(imovel.quartos).toBe(2);
    expect(imovel.banheiros).toBe(1);
    expect(imovel.vagas).toBe(1);
    expect(imovel.imagens).toEqual(['https://www.fastimob.com.br/fotos/364787.jpeg']);
    expect(imovel.link).toBe('https://www.carlosimoveisfranca.com.br/imovel/vende/sp/jardim-santa-barbara/franca/terreno/364787');
  });

  it('should return no imoveis and a default qtd when there are no thumbnails', async () => {
    const html = `<div class="row"></div>`;

    const result = await adapter(html);

    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(12);
  });
});
