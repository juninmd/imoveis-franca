import { adapter } from '../src/sites/famaimoveisfranca';

describe('famaimoveisfranca.com.br scraper', () => {
    it('should parse properties correctly', async () => {
        const html = `
            <h1>27 Imóveis encontrados</h1>
            <div class="imovelcard" data-link="/imovel/3021662/terreno-venda-franca-sp-centro">
                <div class="row">
                    <a href="/imovel/3021662/terreno-venda-franca-sp-centro" title="Terreno para Venda, em Franca, bairro Centro" class="col imovelcard__img">
                        <img src="https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-202406211530139196.jpeg" alt="Terreno para Venda, em Franca, bairro Centro">
                    </a>
                    <div class="col imovelcard__infocontainer">
                        <div class="row imovelcard__infotopcontainer">
                            <div class="col imovelcard__info">
                                <h2 class="imovelcard__info__tag">Venda</h2>
                                <h2 class="imovelcard__info__local">Centro, Franca / SP</h2>
                                <p class="imovelcard__info__ref">Terreno</p>
                                <div class="imovelcard__info__feature">
                                    <i class="fa fa-arrows-h" aria-hidden="true"></i>
                                    <p><b>200,00 m&sup2;</b> &Aacute;rea</p>
                                </div>
                            </div>
                            <div class="col imovelcard__valor">
                                <p class="imovelcard__valor__valor"><span>R$</span> 190.000</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="imovelcard" data-link="/imovel/3569673/apartamento-locacao-sao-jose">
                <div class="row">
                    <a href="/imovel/3569673/apartamento-locacao-sao-jose" title="Apartamento para Locação, bairro São José, 2 dormitórios, 1 banheiro, 1 suíte, 1 vaga" class="col imovelcard__img">
                        <img src="https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-202504271024316066.jpg" alt="Apartamento para Locação, bairro São José">
                    </a>
                    <div class="col imovelcard__infocontainer">
                        <div class="row imovelcard__infotopcontainer">
                            <div class="col imovelcard__info">
                                <h2 class="imovelcard__info__tag">Locação</h2>
                                <h2 class="imovelcard__info__local">São José</h2>
                                <p class="imovelcard__info__ref"><strong>Ref: UNi25</strong> - Apartamento</p>
                                <div class="imovelcard__info__feature">
                                    <i class="fa fa-bed" aria-hidden="true"></i>
                                    <p><b>2</b> <span>Dormitórios</span></p>
                                </div>
                                <div class="imovelcard__info__feature">
                                    <i class="fa fa-shower" aria-hidden="true"></i>
                                    <p><b>1</b> <span>Banheiro</span></p>
                                </div>
                                <div class="imovelcard__info__feature">
                                    <i class="fa fa-car" aria-hidden="true"></i>
                                    <p><b>1</b> <span>Vaga</span></p>
                                </div>
                            </div>
                            <div class="col imovelcard__valor">
                                <p class="imovelcard__valor__valor"><span>R$</span> 1.500</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="imovelcard" data-link="/imovel/2719540/terreno-venda-franca-sp-adelinha">
                <div class="row">
                    <a href="/imovel/2719540/terreno-venda-franca-sp-adelinha" title="Terreno para Venda, em Franca, bairro ADELINHA" class="col imovelcard__img">
                        <img src="https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-20240110162946599.jpg" alt="Terreno para Venda, em Franca, bairro ADELINHA">
                    </a>
                    <div class="col imovelcard__infocontainer">
                        <div class="row imovelcard__infotopcontainer">
                            <div class="col imovelcard__info">
                                <h2 class="imovelcard__info__tag">Venda</h2>
                                <h2 class="imovelcard__info__local">ADELINHA, Franca / SP</h2>
                                <p class="imovelcard__info__ref"><strong>Ref: TE1001HO</strong> - Terreno</p>
                                <div class="imovelcard__info__feature">
                                    <i class="fa fa-arrows-h" aria-hidden="true"></i>
                                    <p><b>450,00 m&sup2;</b> Terreno</p>
                                </div>
                            </div>
                            <div class="col imovelcard__valor">
                                <p class="imovelcard__valor__valor">Consulte</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const res = await adapter(html);

        expect(res.qtd).toBe(27);
        // Only 2 imoveis returned: the "Consulte" card has no valor and is skipped.
        expect(res.imoveis.length).toBe(2);

        const terreno = res.imoveis[0];
        expect(terreno.titulo).toBe('Terreno para Venda, em Franca, bairro Centro');
        expect(terreno.valor).toBe(190000);
        expect(terreno.area).toBe(200);
        expect(terreno.endereco).toBe('CENTRO');
        expect(terreno.link).toBe('https://www.famaimoveisfranca.com.br/imovel/3021662/terreno-venda-franca-sp-centro');
        expect(terreno.imagens).toEqual(['https://imgs2.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-202406211530139196.jpeg']);

        const apto = res.imoveis[1];
        expect(apto.titulo).toBe('Apartamento para Locação, bairro São José, 2 dormitórios, 1 banheiro, 1 suíte, 1 vaga');
        expect(apto.valor).toBe(1500);
        expect(apto.quartos).toBe(2);
        expect(apto.banheiros).toBe(1);
        expect(apto.vagas).toBe(1);
        expect(apto.endereco).toBe('SAO JOSE');
    });

    it('should return no imoveis when there are no cards', async () => {
        const html = `<h1>0 Imóveis encontrados</h1>`;
        const res = await adapter(html);
        expect(res.qtd).toBe(0);
        expect(res.imoveis).toEqual([]);
    });
});
