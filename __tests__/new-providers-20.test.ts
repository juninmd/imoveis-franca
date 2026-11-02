import lcastro, { parseLCastro } from '../src/sites/lcastroimoveis';
import chavecerta from '../src/sites/chavecertafranca';
import vitalize from '../src/sites/vitalizeimoveisfrancasp';
import { sites } from '../src/sites';

const HOST = 'https://www.lcastroimoveis.com.br';
const gallery = '[{&quot;url&quot;:&quot;https://cdn/1.JPG&quot;},{&quot;url&quot;:&quot;&quot;}]';
const card = (over: { path?: string; price?: string; kind?: 'sale' | 'rent'; location?: string; title?: string; metrics?: string; images?: string } = {}) => `
<section class="property-card-search">
  <a class="__link" href="${over.path ?? 'imoveis/casa-em-franca-centro-4529'}"></a>
  <slide-images-lazy v-bind:lazy-images="${over.images ?? gallery}"></slide-images-lazy>
  <div class="property-card-search--prices"><div class="property-card-search--price-${over.kind ?? 'sale'}"><div class="finality-name">x</div><div class="price"> ${over.price ?? 'R$ 250.000,00'} </div></div></div>
  <h3 class="property-card-search--title"> ${over.title ?? 'Casa - REF: 4529'} </h3>
  <div class="property-card-search--location">${over.location ?? 'JARDIM IPANEMA, FRANCA - SP'}</div>
  <div class="property-card-search--description"> Casa ampla </div>
  <div class="compositions">${over.metrics ?? '<div class="composition"><div class="name-composition">Área</div><div class="number">120,50</div></div><div class="composition"><div class="name-composition">Quartos</div><div class="number">3</div></div><div class="composition"><div class="name-composition">Banheiros</div><div class="number">2</div></div><div class="composition"><div class="name-composition">Vagas</div><div class="number">1</div></div>'}</div>
</section>`;
const page = (cards: string[], total = '349 Imóveis') => `<html><body><h1>${total}</h1>${cards.join('')}</body></html>`;

describe('lcastroimoveis (cartoes Vue server-side)', () => {
  it('venda le preco, metricas, galeria do atributo, codigo REF e total do cabecalho', async () => {
    const { imoveis, qtd } = await parseLCastro(page([card()]), 'lcastroimoveis.com.br - Comprar', HOST);
    expect(qtd).toBe(349);
    expect(imoveis[0]).toMatchObject({
      valor: 250000, area: 120.5, quartos: 3, banheiros: 2, vagas: 1, codigo: '4529', tipoImovel: 'casa', endereco: 'JARDIM IPANEMA',
      titulo: 'Casa - JARDIM IPANEMA', imagens: ['https://cdn/1.JPG'], link: `${HOST}/imoveis/casa-em-franca-centro-4529`, precoPorMetro: 250000 / 120.5,
    });
  });

  it('aluguel usa o bloco de locacao; o outro bloco e ignorado', async () => {
    const html = page([card({ kind: 'rent', price: 'R$ 1.700,00' })]);
    expect((await parseLCastro(html, 'l - Alugar', HOST)).imoveis[0].valor).toBe(1700);
    expect((await parseLCastro(html, 'l - Comprar', HOST)).imoveis).toHaveLength(0);
  });

  it('descarta outras cidades, "sob consulta" e sem link; galeria ilegivel e metricas ausentes zeram', async () => {
    const { imoveis } = await parseLCastro(page([
      card({ location: 'CENTRO, RIFAINA - SP' }),
      card({ price: 'SOB CONSULTA' }),
      card({ path: '' }),
      card({ images: 'nao-json', metrics: '', title: 'Terreno' }),
    ], 'sem total'), 'l - Comprar', HOST);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ imagens: [], area: 0, quartos: 0, banheiros: 0, vagas: 0, precoPorMetro: 0, codigo: undefined });
  });

  it('config: ?pagina=N, nomes unicos, e Chave Certa/Vitalize registrados', () => {
    expect(lcastro.map(s => s.name)).toEqual(['lcastroimoveis.com.br - Comprar', 'lcastroimoveis.com.br - Alugar']);
    expect(lcastro[0].getPaginateParams(1)).toEqual({ url: `${HOST}/a-venda` });
    expect(lcastro[1].getPaginateParams(3)).toEqual({ url: `${HOST}/para-alugar?pagina=3` });
    expect(chavecerta.map(s => s.name)).toEqual(['chavecertafranca.com.br - Comprar']);
    expect(vitalize.url).toBe('https://www.vitalizeimoveisfrancasp.com.br/llms.txt');
    [...lcastro, ...chavecerta, vitalize].forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
