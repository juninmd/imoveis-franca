import { adapter } from '../src/sites/conectaassesconimoveis';

describe('conectaassesconimoveis.com.br scraper', () => {
    it('should parse properties correctly', async () => {
        const html = `
            <body>217 Imóveis à venda em Franca</body>
            <li class="Imoveis_cardDisplay__e0Dc8">
                <div class="ImovelCard_card__2FVbS">
                    <a target="_blank" rel="noreferrer" href="/imovel/apartamento/venda/franca/sp/centro/AP0172_CONECT">
                        <img alt="Apartamento" src="http://img.jpg" loading="eager">
                        <img alt="fallback" src="fallback.png">
                        <div class="ImovelCardInfo_info__QFwnz">
                            <h2 class="ImovelCardInfo_titleWrapper__riMwu">
                                <span class="ImovelCardInfo_colorOfTypePropertie__OWVB6" aria-hidden="true">Apartamento</span>
                                <span class="ImovelCardInfo_colorOfTitleCondominium__IfTu_">Apartamento à Venda em Centro</span>
                                <span class="ImovelCardInfo_colorOfLocalization__frnmZ d-none">Apartamento à venda, Edifício Franca Inn, Centro, Franca, SP</span>
                            </h2>
                            <p class="ImovelCardInfo_address__Kq1eI"><span>Centro</span></p>
                            <div class="ImovelCardInfo_features__1Lek_">
                                <ul class="Icons_list__SlDEy">
                                    <li class="Icons_item__ZRMyT"><i data-testid="fa-ruler-horizontal"></i><span class="Icons_value__MnWVl">44m²</span></li>
                                    <li class="Icons_item__ZRMyT"><i data-testid="fa-bed"></i><span class="Icons_value__MnWVl">1</span></li>
                                    <li class="Icons_item__ZRMyT"><i data-testid="fa-shower"></i><span class="Icons_value__MnWVl">1</span></li>
                                    <li class="Icons_item__ZRMyT"><i data-testid="fa-car"></i><span class="Icons_value__MnWVl">1</span></li>
                                </ul>
                            </div>
                            <h3>
                                <span class="ImovelCardInfo_priceValue__9wQx4">R$&nbsp;170.000,00</span>
                            </h3>
                        </div>
                    </a>
                </div>
            </li>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(217);
        expect(res.imoveis.length).toBe(1);

        const imovel = res.imoveis[0];
        expect(imovel.titulo).toBe('Apartamento à Venda em Centro');
        expect(imovel.valor).toBe(170000);
        expect(imovel.area).toBe(44);
        expect(imovel.quartos).toBe(1);
        expect(imovel.banheiros).toBe(1);
        expect(imovel.vagas).toBe(1);
        expect(imovel.endereco).toBe('CENTRO');
        expect(imovel.imagens).toEqual(['http://img.jpg']);
        expect(imovel.link).toBe('https://www.conectaassesconimoveis.com.br/imovel/apartamento/venda/franca/sp/centro/AP0172_CONECT');
    });

    it('should handle duplicates, fallbacks and the empty case', async () => {
        const html = `
            <body></body>
            <li class="Imoveis_cardDisplay__e0Dc8">
                <div class="ImovelCard_card__2FVbS">
                    <a href="/imovel/terreno/venda/franca/sp/centro/TE0068_CONECT">
                        <h2 class="ImovelCardInfo_titleWrapper__riMwu">
                            <span class="ImovelCardInfo_colorOfTypePropertie__OWVB6">Terreno</span>
                            <span class="ImovelCardInfo_colorOfTitleCondominium__IfTu_">Terreno à Venda em Centro</span>
                        </h2>
                        <div>R$ 120.000,00</div>
                    </a>
                </div>
            </li>
            <li class="Imoveis_cardDisplay__e0Dc8">
                <div class="ImovelCard_card__2FVbS">
                    <a href="/imovel/terreno/venda/franca/sp/centro/TE0068_CONECT">
                        <h2 class="ImovelCardInfo_titleWrapper__riMwu">
                            <span class="ImovelCardInfo_colorOfTitleCondominium__IfTu_">Terreno Duplicado</span>
                        </h2>
                        <div>R$ 120.000,00</div>
                    </a>
                </div>
            </li>
            <div>
                <a href="/imovel/pousos/venda/franca/sp/centro/TE9999_CONECT"></a>
            </div>
        `;
        const res = await adapter(html);
        expect(res.qtd).toBe(0);
        expect(res.imoveis.length).toBe(1);
        expect(res.imoveis[0].titulo).toBe('Terreno à Venda em Centro');
    });

    it('should return no items when there are no property links', async () => {
        const html = `<body>0 Imóveis à venda em Franca</body>`;
        const res = await adapter(html);
        expect(res.qtd).toBe(0);
        expect(res.imoveis).toEqual([]);
    });
});
