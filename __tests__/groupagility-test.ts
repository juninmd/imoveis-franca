import { adapter } from '../src/sites/groupagility';

describe('groupagility adapter', () => {
    it('should parse properties correctly', async () => {
        const data = {
            props: {
                pageProps: {
                    pagination: { totalItems: 2 },
                    imoveis: [
                        {
                            id: 1,
                            imv_preco_venda: 500000,
                            imv_area_util: 100,
                            url_amiga: 'link1',
                            fotos: [{ fullsize: 'img1.jpg' }],
                            imv_bairro: 'Centro',
                            imv_titulo: 'Casa bonita',
                            imv_obs: 'Descrição',
                            imv_qtd_dorm: 3,
                            imv_qtd_banheiros: 2,
                            imv_qtd_vagas: 1
                        },
                        {
                            id: 2,
                            imv_preco_venda: 0
                        }
                    ]
                }
            }
        };
        const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify(data) + '</script>';

        const result = await adapter(html);

        expect(result.qtd).toBe(2);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0]).toEqual({
            titulo: 'Casa bonita',
            descricao: 'Descrição',
            imagens: ['img1.jpg'],
            endereco: 'CENTRO',
            valor: 500000,
            area: 100,
            areaTotal: 100,
            quartos: 3,
            banheiros: 2,
            vagas: 1,
            link: 'link1',
            precoPorMetro: 5000,
            site: 'groupagility.com.br',
            entrada: 100000
        });
    });

    it('should handle missing pagination', async () => {
        const data = {
            props: {
                pageProps: {
                    total: 1,
                    imoveis: [
                        {
                            id: 1,
                            imv_preco_venda: 500000,
                            imv_area_total: 100,
                            fotos: [{ imvft_url: 'img1.jpg' }],
                            imv_endereco: 'Rua A'
                        }
                    ]
                }
            }
        };
        const html = '<script id="__NEXT_DATA__" type="application/json">' + JSON.stringify(data) + '</script>';

        const result = await adapter(html);
        expect(result.qtd).toBe(1);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].areaTotal).toBe(100);
        expect(result.imoveis[0].link).toBe('https://www.groupagility.com.br/imovel/1');
    });

    it('should return empty if next data is invalid or empty', async () => {
        expect((await adapter('')).qtd).toBe(0);
        expect((await adapter('<script id="__NEXT_DATA__" type="application/json">{}</script>')).qtd).toBe(0);
    });
});
