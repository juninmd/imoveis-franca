import jedison, { parseJedison } from '../src/sites/jedisonimoveis';
import { sites } from '../src/sites';

const HOST = 'https://www.jedisonimoveis.com.br';
const card = (o: { path?: string; label?: string; price?: string; detalhes?: string; imgs?: string[] } = {}) => `
<div class="resultado resultado_lista">
  <div class="foto"><div class="fotorama">${(o.imgs ?? ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg']).map(i => `<div data-img="${i}"></div>`).join('')}</div></div>
  <a href="${o.path ?? '/comprar/sp/franca/centro/casa/9166389'}"><div class="dados">
    <h3 class="tipo">Casa - Centro</h3><h4 class="localizacao"><span>Centro - Franca/SP</span></h4>
    <div class="detalhes"><div class="detalhe"><span>4<span> dormitórios</span></span></div><div class="detalhe"><span>2<span> banheiros</span></span></div><div class="detalhe"><span>3<span> vagas</span></span></div>
    <div class="detalhe">${o.detalhes ?? '<span>1,00</span><span> m² total </span><span>180,50</span><span> m² construída</span>'}</div></div>
    <div class="descricao"><span>Casa ampla</span></div>
    <div class="alinha_valores"><div class="valor"><small>${o.label ?? 'Venda'}</small><h5>${o.price ?? 'R$ 450.000,00'}</h5></div><div class="referencia"><span>CA00245</span></div></div>
  </div></a>
</div>`;
const page = (cards: string[], pages = 2) => `<html><body>${cards.join('')}${Array.from({ length: pages }, (_, i) => `<a href="/comprar/pagina-${i + 1}/">${i + 1}</a>`).join('')}</body></html>`;

describe('jedisonimoveis (Tokko resultado_lista)', () => {
  it('le preco, metricas, area construida, codigo, imagens sem repeticao e total pelos links de pagina', async () => {
    const { imoveis, qtd } = await parseJedison(page([card()]), 'jedisonimoveis.com.br - Comprar', HOST);
    expect(qtd).toBe(24);
    expect(imoveis[0]).toMatchObject({
      valor: 450000, quartos: 4, banheiros: 2, vagas: 3, area: 180.5, codigo: 'CA00245', tipoImovel: 'casa', endereco: 'CENTRO',
      titulo: 'Casa - Centro', imagens: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'], precoPorMetro: 450000 / 180.5,
      link: `${HOST}/comprar/sp/franca/centro/casa/9166389`,
    });
  });

  it('cada site fica com a sua finalidade (a pagina de venda traz cartoes de locacao)', async () => {
    const html = page([card(), card({ path: '/alugar/sp/franca/centro/casa/1', price: 'R$ 1.500,00', label: 'Locação' })]);
    expect((await parseJedison(html, 'j - Comprar', HOST)).imoveis.map(i => i.valor)).toEqual([450000]);
    expect((await parseJedison(html, 'j - Alugar', HOST)).imoveis.map(i => i.valor)).toEqual([1500]);
  });

  it('descarta "R$ 1,00" (sob consulta), outras cidades e link fora do padrao; area 1,00 vira 0', async () => {
    const { imoveis, qtd } = await parseJedison(page([
      card({ price: 'R$ 1,00' }),
      card({ path: '/comprar/sp/rifaina/centro/casa/2' }),
      card({ path: '/comprar/sp/franca/sem-id' }),
      card({ detalhes: '<span>1,00</span><span> m² total </span>' }),
    ], 0), 'j - Comprar', HOST);
    expect(imoveis).toHaveLength(1);
    expect(qtd).toBe(12);
    expect(imoveis[0]).toMatchObject({ area: 0, precoPorMetro: 0 });
  });

  it('config: /comprar e /alugar paginam em /pagina-N/, nomes unicos', () => {
    expect(jedison.map(s => s.name)).toEqual(['jedisonimoveis.com.br - Comprar', 'jedisonimoveis.com.br - Alugar']);
    expect(jedison[0].getPaginateParams(1)).toEqual({ url: `${HOST}/comprar` });
    expect(jedison[1].getPaginateParams(3)).toEqual({ url: `${HOST}/alugar/pagina-3/` });
    jedison.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
