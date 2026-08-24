import { adapter } from '../src/sites/imobiliarialadonni';

describe('Imobiliaria Ladonni Adapter', () => {
  it('should parse HTML correctly', async () => {
    const html = `
      <div class="grid-9 caixa-imovel">
        <a href="/imovel/111/casa-venda-franca-sp-centro" title="Casa para Venda, em Franca, bairro Centro, 3 dormitórios, 2 banheiros, 1 vagas">
          <div class="item-lista">
            <div class="img-item-lista"><img src="https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb1.jpeg"></div>
            <div class="desc-item-lista">
              <h3 class="cor2">Centro, Franca / SP</h3>
              <small><strong>Ref: 111</strong>&nbsp;Casa para Venda</small>
              <table class="table"><tbody><tr class="icones ico2">
                <td><a data-tooltip="Dormitórios"><i class="fa fa-bed cor4"></i> 3</a></td>
                <td><a data-tooltip="Banheiros"><i class="fa fa-shower cor4"></i> 2</a></td>
                <td><a data-tooltip="Vagas"><i class="fa fa-car cor4"></i> 1</a></td>
              </tr></tbody></table>
              <p>Casa para Venda no bairro Centro, localizado na cidade de Franca / SP.
              Condomínio: R$ 175,00
              &bull; 3 dormitórios, 2 banheiros, 1 vagas, 120 m²...</p>
              <ul>
                <li>R$ 350.000,00</li>
                <li><a href="/imovel/111/casa-venda-franca-sp-centro" class="btver cor0">Ver Detalhes</a></li>
              </ul>
            </div>
          </div>
        </a>
        <a href="/imovel/222/terreno-venda-franca-sp" title="Terreno para Venda, em Franca, bairro -">
          <div class="item-lista">
            <div class="img-item-lista"><img src="https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb2.png"></div>
            <div class="desc-item-lista">
              <h3 class="cor2">-, Franca / SP</h3>
              <small><strong>Ref: 222</strong>&nbsp;Terreno para Venda</small>
              <table class="table"><tbody><tr class="icones ico2">
                <td><a data-tooltip="Área"><i class="fa fa-arrows-h cor4"></i> 600,00 m²</a></td>
              </tr></tbody></table>
              <p>Terreno à venda no bairro -, Franca / SP.
              Condomínio: R$ 100,00
              &bull; Área total de 600 m²...</p>
              <ul>
                <li>Consulte</li>
                <li><a href="/imovel/222/terreno-venda-franca-sp" class="btver cor0">Ver Detalhes</a></li>
              </ul>
            </div>
          </div>
        </a>
      </div>
      <div class="lista_imoveis_paginacao">
        <a href="/imovel//?pag=1" class="lipagina-btn-paginacao-atual">1</a>
        <a href="/imovel//?pag=2" class="lipagina-btn-paginacao">2</a>
        <a href="/imovel//?pag=3" class="lipagina-btn-paginacao">3</a>
      </div>
    `;

    const result = await adapter(html);

    // Only the item with a real price ("R$ 350.000,00") is returned; the
    // "Consulte" item is excluded even though its description mentions a
    // condo fee ("R$ 100,00") that must NOT be mistaken for the price.
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Centro, Franca / SP');
    expect(imovel.valor).toBe(350000);
    expect(imovel.endereco).toBe('CENTRO, FRANCA / SP');
    expect(imovel.link).toBe('https://imobiliarialadonni.com.br/imovel/111/casa-venda-franca-sp-centro');
    expect(imovel.imagens).toEqual(['https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb1.jpeg']);
    expect(imovel.area).toBe(120);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(1);

    // qtd falls back to pagination-link count (2 extra pages) * itemsPerPage (12)
    expect(result.qtd).toBe(24);
  });

  it('should return no imoveis when there are no listing cards', async () => {
    const html = `
      <div class="grid-9 caixa-imovel"></div>
    `;

    const result = await adapter(html);

    expect(result.imoveis).toEqual([]);
    expect(result.qtd).toBe(0);
  });
});
