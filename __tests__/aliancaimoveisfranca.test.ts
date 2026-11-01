import aliancaimoveisfranca from '../src/sites/aliancaimoveisfranca';

describe('aliancaimoveisfranca', () => {
    it('should extract items', async () => {
        const html = `
            <a href="imovel1.php?id=50">
                <div class="imoveis">
                    <div style="background: url('https://aliancaimoveisfranca.com.br//assets/img/arquivos/50/665db7c3f3f1ajpeg.png') !important; background-size: cover !important; background-position: bottom !important; display: flex; justify-content: center; align-items: flex-end; height: 215px; border-radius: 10px 10px 0px 0px;">
                    </div>
                    <div style="height: 196px; padding: 15px 18px;">
                        <div style="height: 100%;">
                            <div style="display: flex; justify-content: space-between;">
                                <div style="width: 100%;">
                                    <div style="display: flex; justify-content: space-between;">
                                        <div class="tipo_imoveis">
                                            <p>R$ 600.000,00</p>
                                        </div>
                                        <div class="codigo">
                                            <p>COD.: 3332</p>
                                        </div>
                                    </div>
                                    <div class="endereco_imoveis">
                                        <p>TERRENO PARA ALUGUEL PARQUE FRANVILLE</p>
                                        <p>Franca, SP</p>
                                    </div>
                                </div>
                            </div>
                            <div class="descricao_imoveis">
                                <p>EXCELENTE TERRENO</p>
                            </div>
                            <div class="icons_imoveis">
                                <div class="detalhes_imoveis">
                                    <i class="fa-regular fa-ruler-horizontal"></i>
                                    <p>250 m²</p>
                                </div>
                                <div class="detalhes_imoveis_bed">
                                    <i class="fa-regular fa-bed"></i>
                                    <p>3</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        `;
        const res = await aliancaimoveisfranca.adapter(html);
        expect(res.imoveis.length).toBe(1);
        expect(res.imoveis[0].valor).toBe(600000);
        expect(res.imoveis[0].area).toBe(250);
        expect(res.imoveis[0].quartos).toBe(3);
        expect(res.imoveis[0].titulo).toBe('TERRENO PARA ALUGUEL PARQUE FRANVILLE');
        expect(res.imoveis[0].endereco).toBe('TERRENO PARA ALUGUEL PARQUE FRANVILLE - Franca, SP');
        expect(res.imoveis[0].imagens[0]).toBe('https://aliancaimoveisfranca.com.br//assets/img/arquivos/50/665db7c3f3f1ajpeg.png');
    });
});
