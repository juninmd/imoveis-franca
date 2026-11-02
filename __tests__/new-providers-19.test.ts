import loft, { parseLoft } from '../src/sites/loft';
import { sites } from '../src/sites';

const HOST = 'https://loft.com.br';
const listing = (over: Record<string, unknown> = {}) => ({
  listing: {
    id: 'abc12345', price: 900000, rentalPrice: 4700, area: 144, landArea: '200.00', bedrooms: 3, restrooms: 2, parkingSpots: 2, photos: ['facade01.jpg', 'facade02.jpg'],
    homeType: 'apartment', description: 'Apartamento <amplo>', agencyName: 'MARIA RITA', address: { neighborhood: 'Centro', city: 'Franca', streetName: 'Rua X' }, ...over,
  },
});
const page = (items: unknown[], total = 160) => {
  const data = { props: { pageProps: { dehydratedState: { queries: [{ state: { data: { listings: items, pagination: { totalListings: total } } } }] } } } };
  return `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script></body></html>`;
};

describe('loft.com.br (marketplace, __NEXT_DATA__)', () => {
  it('venda usa price e aluguel usa rentalPrice; fotos mobile, link por id e metricas', async () => {
    const html = page([listing()]);
    const venda = await parseLoft(html, 'loft.com.br - Comprar', HOST);
    expect(venda.qtd).toBe(160);
    expect(venda.imoveis[0]).toMatchObject({
      valor: 900000, area: 144, areaTotal: 200, quartos: 3, banheiros: 2, vagas: 2, codigo: 'abc12345', tipoImovel: 'apartamento', endereco: 'CENTRO',
      titulo: 'Apartamento - Centro', link: `${HOST}/imovel/abc12345?tipoTransacao=venda`, precoPorMetro: 900000 / 144,
      imagens: ['https://content.loft.com.br/homes/abc12345/mobile_facade01.jpg', 'https://content.loft.com.br/homes/abc12345/mobile_facade02.jpg'],
    });
    const aluguel = await parseLoft(html, 'loft.com.br - Alugar', HOST);
    expect(aluguel.imoveis[0]).toMatchObject({ valor: 4700, link: `${HOST}/imovel/abc12345?tipoTransacao=aluguel` });
  });

  it('descarta imobiliarias que ja tem provider proprio, outras cidades, sem id ou sem preco da finalidade', async () => {
    const out = await parseLoft(page([
      listing({ agencyName: 'MATRIZ COMPRA VENDA E ADMINISTRAÇÃO DE IMOVEIS LTD' }),
      listing({ agencyName: 'SALOMÃO FERREIRA E FERREIRA EMPREENDIMENTOS IMOBIL' }),
      listing({ agencyName: 'B&G Imóveis' }),
      listing({ address: { city: 'Ribeirão Preto' } }),
      listing({ id: undefined }),
      listing({ price: 0 }),
      { listing: undefined },
    ]), 'loft.com.br - Comprar', HOST);
    expect(out.imoveis).toHaveLength(0);
  });

  it('sem area, tipo, bairro, fotos, agencia e total: campos zeram e qtd cai para o lido', async () => {
    const bare = listing({ area: undefined, landArea: undefined, homeType: 'unknown', photos: undefined, agencyName: null, address: { city: 'Franca' }, bedrooms: undefined, restrooms: undefined, parkingSpots: undefined, description: undefined });
    const out = await parseLoft(page([bare], 0), 'loft.com.br - Comprar', HOST);
    expect(out.qtd).toBe(1);
    expect(out.imoveis[0]).toMatchObject({ area: 0, areaTotal: 0, imagens: [], titulo: '', endereco: '', quartos: 0, banheiros: 0, vagas: 0, precoPorMetro: 0, tipoImovel: undefined });
  });

  it('pagina sem __NEXT_DATA__ ou sem queries nao quebra', async () => {
    expect((await parseLoft('<html></html>', 'loft.com.br - Comprar', HOST)).imoveis).toEqual([]);
    const empty = `<script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>`;
    expect((await parseLoft(empty, 'loft.com.br - Comprar', HOST)).qtd).toBe(0);
  });

  it('config: pagina por ?pagina=N, nomes unicos por finalidade', () => {
    expect(loft.map(s => s.name)).toEqual(['loft.com.br - Comprar', 'loft.com.br - Alugar']);
    expect(loft[0].getPaginateParams(1)).toEqual({ url: `${HOST}/venda/imoveis/sp/franca` });
    expect(loft[1].getPaginateParams(2)).toEqual({ url: `${HOST}/aluguel/imoveis/sp/franca?pagina=2` });
    loft.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
