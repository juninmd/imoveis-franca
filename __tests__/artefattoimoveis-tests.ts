import { adapter } from '../src/sites/artefattoimoveis';

describe('artefattoimoveis', () => {
  it('should adapt HTML correctly', async () => {
    const html = `
    <article class="item h-585 p-5 -m-b-10 overflow-h- col-33 col-lg-50 col-sm-100">
      <div class="inside-item d-block full bd bd-rd-20 bg-white p-relative overflow-h">
        <div class="img-area d-block col-100 p-relative overflow-h">
          <figure data-id="0" class="fig-list d-block full p-relative img-list-0 active">
            <img class="fit-center- fit-cover" loading="lazy" src="thumb.php?img=https://img.voaimgs.com.br/1108/imoveis/1/img.jpeg&w=600">
            <figcaption>
              <a class="ab-t-l full z-index-200" href="/imovel/123"></a>
            </figcaption>
          </figure>
        </div>
        <a class="d-block" href="/imovel/123" target="_blank" aria-label="Link imóvel">
          <div class="infos p-15 txt-l txt-default font-ope">
            <div class="tit-area h-85 d-flex justify-content-center flex-direction-column">
              <h2 class="d-block tit-list lh-1-4 fw-600">Casa Nova</h2>
              <p class="d-block p-t-10 tit-list fs-17 lh-1-4">
                <i class="fas fa-map-marker-alt fa-1x m-r-5"></i>
                Centro, Franca
              </p>
            </div>
            <div class="d-block p-t-15">
              <span class="txt d-iblock p-b-5 lh-1-4 fs-15 fw-600">3 quartos</span>
              <span class="txt d-iblock p-b-5 lh-1-4 fs-15 fw-600">2 suítes</span>
              <span class="txt d-iblock p-b-5 lh-1-4 fs-15 fw-600">2 vagas</span>
              <span class="txt d-iblock p-b-5 lh-1-4 fs-15 fw-600">120m²</span>
            </div>
            <div class="price-area d-block p-t-15 nowrap">
              <p class="d-block p-b-5 fs-15 lh-1-4">Venda</p>
              <p class="d-block p-b-5 fw-700 fs-20">R$ 500.000</p>
            </div>
          </div>
        </a>
      </div>
    </article>
    `;

    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Nova');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].area).toBe(120);
    expect(imoveis[0].endereco).toBe('CENTRO');
  });

  it('should ignore item without title', async () => {
    const html = '<article class="item"><a href="/imovel/123"></a></article>';
    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(0);
  });
});
