import { adapter } from '../src/sites/unioconimobiliaria';
import unioconimobiliaria from '../src/sites/unioconimobiliaria';

describe('Uniocon Imobiliaria Adapter', () => {
  it('should get correct paginate params', () => {
    expect(unioconimobiliaria.getPaginateParams(1)).toEqual({
      url: 'https://www.unioconimobiliaria.com.br/imoveis'
    });

    expect(unioconimobiliaria.getPaginateParams(2)).toEqual({
      url: 'https://www.unioconimobiliaria.com.br/imoveis?page=2'
    });
  });

  it('should parse HTML correctly', async () => {
    const mockHtml = `
      <body>
        <span class="ListaTitulo result_145">Foram encontrados <span class="ListaImovelTotal">145</span> imóveis</span>
        <div id="2295143" class="Imovel_2295143 ImovelItem LI_Imovel Cont1_4 Cont2_3">
            <div class="LI_ImovelInner salePurposeClass">
                <div class="ImageSide">
                    <a href="/apartamento-com-2-quartos-vila-santa-cruz-franca" class="Image ImovelLinkClick">
                        <div class="ImovelImagesSlider">
                            <img loading="lazy" class="BannerImage ObjectCover" src="https://img.apre.me/img1.jpg" alt="Apartamento com 2 quartos, Vila Santa Cruz - Franca" />
                        </div>
                    </a>
                </div>
                <div class="DescSide">
                    <div class="DescContent">
                        <div class="BoxTitle">
                            <a href="/apartamento-com-2-quartos-vila-santa-cruz-franca" class="Title">Apartamento com 2 quartos, Vila Santa Cruz - Franca</a>
                            <span class="ImovelValor ValorDestaque">
                                <span class="ValorMoeda valorNaoNulo">
                                    <span class="Valor"> <span class="value "><span class="Moeda">R$</span> 350.000</span> </span>
                                </span>
                            </span>
                            <span class="Endereco"> <span class="Cep">CEP: 14403-836</span><span class="virgula">, </span><span class="Rua">Rua Bahij Toufik Kanawati</span><span class="virgula">, </span><span class="Bairro notranslate">Vila Santa Cruz</span><span class="virgula">, </span><span class="cidade notranslate">Franca</span></span>
                            <span class="Resumo">
                                <span class="ResumoItens">
                                    <span class="ResumoItem BEDROOM " title=" 2 Dormitório(s)"><span class="val">2</span></span>
                                    <span class="ResumoItem BATHROOM " title=" 1 Banheiro(s)"><span class="val">1</span></span>
                                    <span class="ResumoItem GARAGE " title=" 1 Vaga(s)"><span class="val">1</span></span>
                                    <span class="ResumoItem AREA_USEFUL " title=" Útil: 150m²"><span class="val">150m²</span></span>
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </body>
    `;

    const { imoveis, qtd } = await adapter(mockHtml);

    expect(qtd).toBe(145);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toEqual(expect.objectContaining({
      titulo: 'Apartamento com 2 quartos, Vila Santa Cruz - Franca',
      endereco: 'VILA SANTA CRUZ',
      valor: 350000,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      area: 150,
      areaTotal: 150,
      link: 'https://www.unioconimobiliaria.com.br/apartamento-com-2-quartos-vila-santa-cruz-franca',
      imagens: ['https://img.apre.me/img1.jpg'],
      site: 'unioconimobiliaria.com.br',
      entrada: 70000
    }));
  });

  it('should handle edge cases and missing fields', async () => {
    const mockHtml = `
      <body>
        <!-- Missing quantity -->
        <div class="ImovelItem LI_Imovel">
            <!-- Missing title -->
            <span class="ImovelValor"><span class="Valor"><span class="value">R$ 200.000</span></span></span>
        </div>

        <div class="ImovelItem LI_Imovel">
            <!-- no price -->
            <a class="Title" href="https://www.unioconimobiliaria.com.br/lote-terreno-jardim-palestina-franca">Lote/Terreno, Jardim Palestina - Franca</a>
        </div>

        <div class="ImovelItem LI_Imovel">
            <a class="Title" href="/casa-com-2-quartos-venda-jardim-bonsucesso-franca">Casa com 2 quartos à Venda, Jardim Bonsucesso - Franca</a>
            <span class="ImovelValor"><span class="Valor"><span class="value">R$ 200.000</span></span></span>
            <span class="Endereco"><span class="Bairro notranslate">Jardim Bonsucesso</span></span>
            <span class="ResumoItens">
                <span class="ResumoItem BEDROOM "><span class="val">2</span></span>
                <span class="ResumoItem GARAGE "><span class="val">1</span></span>
            </span>
        </div>
      </body>
    `;

    const { imoveis, qtd } = await adapter(mockHtml);

    expect(qtd).toBe(0);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0].titulo).toBe('Casa com 2 quartos à Venda, Jardim Bonsucesso - Franca');
    expect(imoveis[0].endereco).toBe('JARDIM BONSUCESSO');
    expect(imoveis[0].valor).toBe(200000);
    expect(imoveis[0].quartos).toBe(2);
    expect(imoveis[0].vagas).toBe(1);
    expect(imoveis[0].link).toBe('https://www.unioconimobiliaria.com.br/casa-com-2-quartos-venda-jardim-bonsucesso-franca');
  });
});
