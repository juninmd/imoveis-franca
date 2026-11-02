import vencer, { parseVencer, VencerItem } from '../src/sites/vencerimoveis';
import morar from '../src/sites/imoveismorar';
import senhorferreira from '../src/sites/senhorferreira';
import edna from '../src/sites/ednaimoveis';
import { sites } from '../src/sites';

const item = (over: Partial<VencerItem> = {}, acf: Record<string, unknown> = {}): VencerItem => ({
  id: 12469, link: 'https://www.vencerimoveis.com.br/propriedades/casa/franca-sp/casa-a-venda/', title: { rendered: 'CASA A VENDA JARDIM CONSOLAÇÃO' },
  content: { rendered: '<p>Jardim Consolação</p><p>250m terreno<br/>234m área construída<br/>2 vagas cobertas</p>' },
  class_list: ['estate', 'tipo-imovel-casa', 'finalidade-venda', 'cidade-franca-sp', 'bairro-jardim-natal'],
  acf_fields: {
    estate_attr_price: '990000', estate_attr_bedrooms: '3 SUITES', estate_attr_bathrooms: '2', 'estate_attr_property-size': '234', 'estate_attr_lot-size': '250',
    estate_gallery: [{ url: 'https://img/a.jpeg?v=1792614353' }, { url: '' }], ...acf,
  }, ...over,
});

describe('vencerimoveis (WordPress MyHome)', () => {
  it('le preco, comodos, areas, vagas do texto, bairro/tipo das classes e fotos sem o cache-buster', async () => {
    const { imoveis, qtd } = await parseVencer([item()]);
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({
      valor: 990000, quartos: 3, banheiros: 2, vagas: 2, area: 234, areaTotal: 250, codigo: '12469', tipoImovel: 'casa', endereco: 'JARDIM NATAL',
      titulo: 'CASA A VENDA JARDIM CONSOLAÇÃO', imagens: ['https://img/a.jpeg'], precoPorMetro: 990000 / 234,
      link: 'https://www.vencerimoveis.com.br/propriedades/casa/franca-sp/casa-a-venda/',
    });
  });

  it('descarta outras cidades, sem preco, sem id ou link; aceita corpo invalido e JSON em texto', async () => {
    const other = item({ class_list: ['cidade-rifaina'] });
    const out = await parseVencer(JSON.stringify([other, item({}, { estate_attr_price: '' }), item({ id: undefined }), item({ link: undefined })]));
    expect(out.imoveis).toHaveLength(0);
    expect((await parseVencer({})).imoveis).toEqual([]);
  });

  it('sem metricas, galeria, classes de bairro/tipo e conteudo: campos zeram', async () => {
    const bare = item({ class_list: ['cidade-franca-sp'], content: undefined, title: undefined, acf_fields: { estate_attr_price: '100.000', estate_gallery: false } });
    const { imoveis } = await parseVencer([bare]);
    expect(imoveis[0]).toMatchObject({ valor: 100000, area: 0, areaTotal: 0, quartos: 0, banheiros: 0, vagas: 0, imagens: [], precoPorMetro: 0, titulo: '', tipoImovel: undefined });
    const noAcf = await parseVencer([{ ...bare, acf_fields: undefined }]);
    expect(noAcf.imoveis).toHaveLength(0);
  });

  it('area so do lote vira a area de preco; config unica e registrada', async () => {
    const { imoveis } = await parseVencer([item({}, { 'estate_attr_property-size': '' })]);
    expect(imoveis[0]).toMatchObject({ area: 250, areaTotal: 250 });
    expect(vencer).toMatchObject({ tipo: 'venda', driver: 'axios_rest', name: 'vencerimoveis.com.br' });
    expect(vencer.getPaginateParams(1).url).toContain('/wp-json/wp/v2/estate?per_page=100');
    expect(sites.filter(s => s.name === 'vencerimoveis.com.br')).toHaveLength(1);
  });
});

describe('registro (17): Morar (Kenlo), Senhor Ferreira e Edna (gridlist)', () => {
  it('nomes unicos por finalidade e URLs do host proprio', () => {
    expect(morar.map(s => s.name)).toEqual(['imoveismorar.com.br - Comprar', 'imoveismorar.com.br - Alugar']);
    expect(morar[0].url).toBe('https://www.imoveismorar.com.br/api/listings/a-venda');
    expect(morar[1].getPaginateParams(2)).toEqual({ url: 'https://www.imoveismorar.com.br/api/listings/para-alugar?pagina=2' });
    expect(senhorferreira[0].url).toBe('https://www.senhorferreira.com.br/secao/venda');
    expect(edna[1].getPaginateParams(2)).toEqual({ url: 'https://www.ednaimoveis.com.br/secao/aluguel?pag=2' });
    [...morar, ...senhorferreira, ...edna].forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
