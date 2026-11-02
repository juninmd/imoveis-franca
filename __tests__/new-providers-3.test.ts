import sold, { adapter as soldAdapter } from '../src/sites/soldimob';
import jlb, { adapter as jlbAdapter, parsePrice } from '../src/sites/jlbarcellosimoveis';
import { sites } from '../src/sites';

const soldItem = (over: Record<string, unknown> = {}) => ({
  about_title: 'Sobre casa com 58 m² em Franca - SP',
  listing_description: 'Bairro: Peres Elias, Franca/SP.\r\n\r\n* Área Total: 220,00 m²\r\n* Área  Útil: 58,00 m²\r\nCasa à venda!',
  city: 'Franca',
  neighborhood_display: 'Residencial Peres Elias',
  property_type: 'HOUSE',
  sale_price: [315000, 315000],
  area: [58, 58], bedrooms: [2, 2], bathrooms: [1, 1], garages: [2, 2],
  photos: [{ picture_full: 'https://img.kenlo.io/1.jpg' }, { picture_full: 'https://img.kenlo.io/2.jpg' }, {}],
  property_full_reference: 'CA1505-GLEM',
  url: '/imovel/casa-franca-2-quartos-58-m/CA1505-GLEM',
  ...over,
});

describe('soldimob (API Kenlo)', () => {
  it('le detalhes, todas as fotos, area total da descricao e referencia', async () => {
    const { imoveis, qtd } = await soldAdapter({ count: 923, data: [soldItem()] });
    expect(qtd).toBe(923);
    expect(imoveis[0]).toMatchObject({
      titulo: 'casa com 58 m² em Franca - SP', valor: 315000, area: 58, areaTotal: 220, quartos: 2, banheiros: 1, vagas: 2,
      endereco: 'RESIDENCIAL PERES ELIAS', codigo: 'CA1505-GLEM', tipoImovel: 'casa', site: 'soldimob.com.br',
      link: 'https://www.soldimob.com.br/imovel/casa-franca-2-quartos-58-m/CA1505-GLEM',
      imagens: ['https://img.kenlo.io/1.jpg', 'https://img.kenlo.io/2.jpg'],
    });
    expect(imoveis[0].descricao).toContain('Casa à venda');
  });

  it('descarta cidades vizinhas, sem url e sem preco', async () => {
    const { imoveis } = await soldAdapter({ count: 3, data: [soldItem({ city: 'Rifaina' }), soldItem({ url: undefined }), soldItem({ sale_price: [0, 0] })] });
    expect(imoveis).toHaveLength(0);
  });

  it('aluguel usa rent_price; sem area total na descricao usa a area util; foto de capa quando nao ha galeria', async () => {
    const { imoveis } = await soldAdapter({ count: 1, data: [soldItem({
      sale_price: [0, 0], rent_price: [12000, 12000], listing_description: 'Salão', photos: [], picture_full: 'https://img.kenlo.io/capa.jpg', property_type: 'HALL',
    })] });
    expect(imoveis[0]).toMatchObject({ valor: 12000, areaTotal: 58, imagens: ['https://img.kenlo.io/capa.jpg'], tipoImovel: 'comercial' });
  });

  it('tipo desconhecido cai na inferencia pelo titulo; campos ausentes viram zero', async () => {
    const { imoveis } = await soldAdapter({ data: [soldItem({
      property_type: 'WEIRD', about_title: 'Sobre chácara em Franca', area: undefined, bedrooms: undefined, photos: undefined, picture_full: undefined,
      neighborhood_display: undefined, neighborhood: 'Zona Rural', listing_description: undefined,
    })] });
    expect(imoveis[0]).toMatchObject({ tipoImovel: 'rural', area: 0, quartos: 0, imagens: [], endereco: 'ZONA RURAL', precoPorMetro: 0 });
  });

  it('aceita o corpo como string JSON e payload vazio', async () => {
    expect((await soldAdapter(JSON.stringify({ count: 1, data: [soldItem()] }))).imoveis).toHaveLength(1);
    expect(await soldAdapter({})).toMatchObject({ imoveis: [], qtd: 0 });
  });

  it('pagina por ?pagina=N, uma entrada por finalidade', () => {
    expect(sold.map(s => [s.name, s.tipo])).toEqual([['soldimob.com.br - Comprar', 'venda'], ['soldimob.com.br - Alugar', 'aluguel']]);
    expect(sold[0].getPaginateParams(1).url).toBe('https://www.soldimob.com.br/api/listings/a-venda');
    expect(sold[1].getPaginateParams(3).url).toBe('https://www.soldimob.com.br/api/listings/para-alugar?pagina=3');
  });

  it('o adapter registrado usa o nome do site', async () => {
    const { imoveis } = await sold[1].adapter({ data: [soldItem()] } as unknown as string);
    expect(imoveis[0].site).toBe('soldimob.com.br - Alugar');
  });
});

const images = JSON.stringify([{ image: 'https://jl/1.jpeg' }, { image: 'https://jl/2.jpeg' }, { image: 'https://jl/1.jpeg' }]);
const jlbCard = (opts: { title: string; price: string; href: string; dataImages?: string }) => `
<div class="item-listing-wrap hz-item-gallery-js card" data-images='${opts.dataImages ?? images}'>
  <ul class="item-price-wrap"><li class="item-price">${opts.price}</li></ul>
  <img src="https://jl/capa.jpeg">
  <h2 class="item-title"><a href="${opts.href}">${opts.title}</a></h2>
  <address class="item-address">Cidade Nova</address>
  <ul class="item-amenities">
    <li class="h-beds"><span class="hz-figure">3 sendo 3 suítes</span></li>
    <li class="h-baths"><span class="hz-figure">2</span></li>
    <li class="h-cars"><span class="hz-figure">2</span></li>
    <li class="h-area"><span class="hz-figure">143</span></li>
    <li class="h-type"><span>Apartamento</span></li>
  </ul>
  <div class="item-author"><a href="/corretor/x/">Carlos Barcellos</a></div>
</div>`;

describe('jlbarcellosimoveis (WordPress Houzez)', () => {
  it.each([
    ['R$1,390,000.00', 1390000],
    ['R$ 1.390.000,00', 1390000],
    ['R$2,500.00', 2500],
    ['R$ 800', 800],
    ['Consulte', 0],
  ])('preco %s -> %d', (text, expected) => {
    expect(parsePrice(text)).toBe(expected);
  });

  it('le o card com galeria completa sem repetir foto, comodos e corretor', async () => {
    const html = `${jlbCard({ title: 'Apartamento à Venda – Edifício Modernitá', price: 'R$1,390,000.00', href: 'https://jlbarcellosimoveis.com.br/propriedade/apartamento-a-venda-modernita/' })}
      <a class="page-numbers">1</a><a class="page-numbers">3</a>`;
    const { imoveis, qtd } = await jlbAdapter(html);
    expect(qtd).toBe(30);
    expect(imoveis[0]).toMatchObject({
      valor: 1390000, area: 143, quartos: 3, banheiros: 2, vagas: 2, endereco: 'CIDADE NOVA', tipoImovel: 'apartamento',
      codigo: 'apartamento-a-venda-modernita', imagens: ['https://jl/1.jpeg', 'https://jl/2.jpeg'],
    });
    expect(imoveis[0].descricao).toContain('Corretor: Carlos Barcellos');
  });

  it('galeria invalida ou ausente cai na imagem de capa; sem paginacao usa a contagem de cards', async () => {
    const html = jlbCard({ title: 'Casa', price: 'R$ 500.000', href: '/p/casa/', dataImages: 'nao-e-json' })
      + jlbCard({ title: 'Sem preço', price: 'Consulte', href: '/p/x/' })
      + jlbCard({ title: 'Sem link', price: 'R$ 1', href: '' });
    const { imoveis, qtd } = await jlbAdapter(html);
    expect(qtd).toBe(3);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0].imagens).toEqual(['https://jl/capa.jpeg']);
  });

  it('galeria vazia e sem capa nao quebra', async () => {
    const html = '<div class="item-listing-wrap"><ul><li class="item-price">R$ 100.000</li></ul><h2 class="item-title"><a href="/p/a/">A</a></h2></div>';
    const { imoveis } = await jlbAdapter(html);
    expect(imoveis[0]).toMatchObject({ imagens: [], area: 0, quartos: 0, endereco: '', precoPorMetro: 0, tipoImovel: undefined });
  });

  it('"Venda/Locação" entra so na lista de venda (o preco e de venda)', async () => {
    const html = jlbCard({ title: 'Apartamento Para Venda/Locação – Villagio', price: 'R$ 900.000', href: '/p/v/' });
    expect((await jlbAdapter(html, 'x', 'venda')).imoveis).toHaveLength(1);
    expect((await jlbAdapter(html, 'x', 'aluguel')).imoveis).toHaveLength(0);
  });

  it('pagina por /page/N/ e o adapter registrado propaga a finalidade', async () => {
    expect(jlb.map(s => s.tipo)).toEqual(['venda', 'aluguel']);
    expect(jlb[0].getPaginateParams(1).url).toBe('https://jlbarcellosimoveis.com.br/finalidade/venda/');
    expect(jlb[1].getPaginateParams(2).url).toBe('https://jlbarcellosimoveis.com.br/finalidade/aluguel/page/2/');
    const html = jlbCard({ title: 'Casa Para Venda/Locação', price: 'R$ 900.000', href: '/p/v/' });
    expect((await jlb[1].adapter(html)).imoveis).toHaveLength(0);
    expect((await jlb[0].adapter(html)).imoveis[0].site).toBe('jlbarcellosimoveis.com.br - Comprar');
  });
});

describe('registro (3)', () => {
  it('registra cada novo provider exatamente uma vez', () => {
    const names = sites.map(s => s.name);
    ['soldimob.com.br - Comprar', 'soldimob.com.br - Alugar', 'jlbarcellosimoveis.com.br - Comprar', 'jlbarcellosimoveis.com.br - Alugar']
      .forEach(name => expect(names.filter(n => n === name)).toHaveLength(1));
  });
});
