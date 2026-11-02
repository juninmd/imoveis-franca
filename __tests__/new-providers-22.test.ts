import deztop, { parseDeztop, DEZTOP_SALE_BANDS } from '../src/sites/deztop';
import { sites } from '../src/sites';

const card = (over: { href?: string; price?: string; address?: string; badges?: string[]; type?: string; img?: string } = {}) => `
<article>
  <div class="pc-media"><picture><source srcset="https://cdn.example.com/a_500.webp"><img src="${over.img ?? 'https://cdn.example.com/a_640.webp'}"></picture></div>
  <h3 title="x"><a href="${over.href ?? 'https://deztop.com/br/imovel/310130090/casa-3-quartos-franca'}">Casa Ampla no Centro</a></h3>
  <p class="small fw-light crop-text-3">Casa com quintal</p>
  <p>${(over.badges ?? ['3 Dormitórios', '2 Banheiros', '2 Vagas na garagem', '1.060m² de Área', 'Piscina']).map(b => `<span class="badge text-bg-light">${b}</span>`).join('')}</p>
  <div class="visually-hidden"><ul><li>${over.type ?? 'Casa em condomínio'}</li><li><span class="badge">Venda</span></li></ul></div>
  <address><span><svg></svg></span> ${over.address ?? 'Jardim Aeroporto II, Franca - SP'}</address>
  <ul><li><p class="fs-5 text-dark m-0">${over.price ?? 'R$1.200.000'}</p></li><li><small>Condomínio R$795</small></li></ul>
</article>`;
const page = (cards: string[], total = '8.857 imóveis') => `<html><body><h1>${total}</h1><article>${cards.join('')}</article></body></html>`;

describe('deztop (classificado)', () => {
  it('le preco, metricas com milhar, imagem unica, codigo do link e total do cabecalho', async () => {
    const { imoveis, qtd } = await parseDeztop(page([card()]), 'deztop.com - Comprar');
    expect(qtd).toBe(8857);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({
      valor: 1200000, quartos: 3, banheiros: 2, vagas: 2, area: 1060, codigo: '310130090', tipoImovel: 'casa',
      endereco: 'JARDIM AEROPORTO II', imagens: ['https://cdn.example.com/a_640.webp'], precoPorMetro: 1200000 / 1060,
      link: 'https://deztop.com/br/imovel/310130090/casa-3-quartos-franca',
    });
  });

  it('ignora o artigo que envolve a lista, outras cidades, placeholder de preco "R$1" e cartao sem link', async () => {
    const { imoveis, qtd } = await parseDeztop(page([
      card({ address: 'Centro, Ribeirão Preto - SP' }),
      card({ price: 'R$1' }),
      card({ href: '' }),
      card({ badges: [], type: 'Terreno' }),
    ], 'sem total'), 'deztop.com - Comprar');
    expect(imoveis).toHaveLength(1);
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({ quartos: 0, banheiros: 0, vagas: 0, area: 0, precoPorMetro: 0, tipoImovel: 'terreno' });
  });

  it('config: venda em faixas de preco que cabem no teto, aluguel numa busca so, nomes unicos', () => {
    const [venda, aluguel] = deztop;
    expect([venda.name, aluguel.name]).toEqual(['deztop.com - Comprar', 'deztop.com - Alugar']);
    expect(venda.params).toEqual(DEZTOP_SALE_BANDS);
    expect(venda.appendParams).toBe(true);
    expect(aluguel.params).toEqual([]);
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://deztop.com/br/imoveis/sp/franca/venda' });
    expect(aluguel.getPaginateParams(3)).toEqual({ url: 'https://deztop.com/br/imoveis/sp/franca/aluguel?page=3' });
    expect(venda.maxPages).toBe(96);
    deztop.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
