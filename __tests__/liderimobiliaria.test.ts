import site, { adapter } from '../src/sites/liderimobiliaria';

describe('liderimobiliaria (Imoview)', () => {
  const item = {
    codigo: 18049,
    titulo: 'fazenda-na-area-rural-de-franca-sp',
    tipo: 'Fazenda',
    valor: 'R$ 170.000.000,00',
    bairro: 'Área Rural de Franca',
    cidade: 'FRANCA',
    endereco: 'Área Rural',
    numeroquartos: '3',
    numerobanhos: '2',
    numerovagas: '1',
    areainterna: '0,00',
    arealote: '0,00',
    areaprincipal: '450,00',
    tipomedida: 'alq.',
    urlfotoprincipalp: 'https://cdn.imoview.com.br/a.jpg',
    fotos: [{ urlp: 'https://cdn.imoview.com.br/a.jpg' }, { urlp: 'https://cdn.imoview.com.br/b.jpg' }],
    descricaoFotoPrincipal: 'Fazenda à venda',
  };

  it('usa o endpoint /imoveis/ajax/ filtrando Franca e paginando', () => {
    expect(site.name).toBe('liderimobiliaria.com.br');
    expect(site.driver).toBe('axios_rest');
    expect(site.url).toBe('https://www.liderimobiliaria.com.br/imoveis/ajax/');
    const p = site.getPaginateParams(2).payload.imovel;
    expect(p.codigocidade).toBe(62);
    expect(p.numeropagina).toBe(2);
    expect(p.finalidade).toBe('venda');
  });

  it('retorna vazio para conteudo invalido', async () => {
    expect((await adapter('<html></html>')).imoveis).toEqual([]);
    expect(await adapter({ quantidade: 0, lista: [] })).toMatchObject({ imoveis: [], qtd: 0 });
  });

  it('mapeia a lista e ignora warnings do PHP antes do JSON', async () => {
    const json = JSON.stringify({ quantidade: 5, lista: [item, { ...item, codigo: 2, valor: 'R$ 0,00' }] });
    const result = await adapter(`<br /><b>Warning</b>: x\n${json}`);
    expect(result.qtd).toBe(5);
    expect(result.imoveis).toHaveLength(1);
    expect(result.imoveis[0]).toMatchObject({
      valor: 170000000,
      quartos: 3,
      banheiros: 2,
      vagas: 1,
      area: 0, // areaprincipal em alqueires nao e m2
      link: 'https://www.liderimobiliaria.com.br/imovel/fazenda-na-area-rural-de-franca-sp/18049',
      site: 'liderimobiliaria.com.br',
    });
    expect(result.imoveis[0].imagens).toHaveLength(2);
  });

  it('usa area interna (ou do lote para terreno)', async () => {
    const r = await adapter({
      quantidade: 2,
      lista: [
        { ...item, tipo: 'Casa', areainterna: '120,50', tipomedida: 'm²' },
        { ...item, codigo: 3, tipo: 'Terreno', arealote: '300,00', areainterna: '0,00', tipomedida: 'm²' },
      ],
    });
    expect(r.imoveis.map(i => i.area)).toEqual([120.5, 300]);
  });
});
