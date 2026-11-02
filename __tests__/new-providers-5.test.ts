import menezes, { parseMenezes } from '../src/sites/menezesimobi';
import { sites } from '../src/sites';

const HOST = 'https://menezesimobi.com.br';

const card = (path: string, prices: string, extra = '', ref = 'AP00768', bairro = 'Jardim Aeroporto II - Franca/SP') => `
<div class="resultado_novo">
  <a class="botao_ver_mais" href="${path}">Ver mais</a>
  <h3 class="titulo_novo">APARTAMENTO</h3>
  ${prices}
  <div class="swiper-wrapper"><div class="swiper-slide"><img src="https://static.tokkobroker.com/1.jpg"></div><div class="swiper-slide"><img src="https://static.tokkobroker.com/2.jpg"></div></div>
  <div class="icones_caracteristicas">${extra}</div>
  <div class="final_card"><span>${bairro}</span></div>
  <a class="flag_ref"><span>Ref.${ref}</span></a>
</div>`;

const price = (label: string, value: string) => `<div class="valor_novo"><small>${label}</small><h5>${value}</h5></div>`;
const feature = (n: number, label: string) => `<div class="detalhe_novo"><div class="icone_numero"><span>${n}</span></div><span> ${label}</span></div>`;

const page = (cards: string[], header = '1223 imóveis à venda encontrados') => `<html><body><p>${header}</p>${cards.join('')}</body></html>`;

describe('menezesimobi (Univen/Tokko)', () => {
  it('le preco, fotos, comodos, referencia e total (que cobre todas as cidades)', async () => {
    const html = page([card('/comprar/sp/franca/jardim-aeroporto-ii/apartamento/1', price('VENDA', 'R$ 420.000,00'),
      feature(2, 'quartos') + feature(1, 'banheiros') + feature(2, 'vagas') + feature(85, 'm²'))]);
    const { imoveis, qtd } = await parseMenezes(html, 'menezesimobi.com.br - Comprar', HOST);
    expect(qtd).toBe(1223);
    expect(imoveis[0]).toMatchObject({
      valor: 420000, quartos: 2, banheiros: 1, vagas: 2, area: 85, precoPorMetro: 420000 / 85, codigo: 'AP00768', tipoImovel: 'apartamento',
      endereco: 'JARDIM AEROPORTO II', site: 'menezesimobi.com.br - Comprar', link: `${HOST}/comprar/sp/franca/jardim-aeroporto-ii/apartamento/1`,
      imagens: ['https://static.tokkobroker.com/1.jpg', 'https://static.tokkobroker.com/2.jpg'],
    });
  });

  it('descarta outras cidades e precos placeholder (R$ 1,00) ou ausentes', async () => {
    const html = page([
      card('/comprar/sp/rifaina/centro/casa/2', price('VENDA', 'R$ 300.000,00')),
      card('/comprar/mg/sacramento/centro/casa/3', price('VENDA', 'R$ 300.000,00')),
      card('/comprar/sp/franca/centro/casa/4', price('VENDA', 'R$ 1,00')),
      card('/comprar/sp/franca/centro/casa/5', ''),
    ]);
    const { imoveis, qtd } = await parseMenezes(html, 'menezesimobi.com.br - Comprar', HOST);
    expect(imoveis).toHaveLength(0);
    expect(qtd).toBe(1223);
  });

  it('aluguel usa o valor de LOCACAO mesmo em cartao venda+locacao (comprar-ou-alugar)', async () => {
    const both = card('/comprar-ou-alugar/sp/franca/santo-agostinho/apartamento/6', price('VENDA', 'R$ 369.000,00') + price('LOCAÇÃO', 'R$ 1.500,00'));
    const rent = await parseMenezes(page([both], '1 imóveis para locação encontrados'), 'menezesimobi.com.br - Alugar', HOST);
    const buy = await parseMenezes(page([both]), 'menezesimobi.com.br - Comprar', HOST);
    expect(rent.imoveis[0].valor).toBe(1500);
    expect(rent.qtd).toBe(1);
    expect(buy.imoveis[0].valor).toBe(369000);
  });

  it('sem total no cabecalho usa a contagem de cartoes; sem cartoes retorna vazio', async () => {
    const one = card('/alugar/sp/franca/centro/barracao/7', price('LOCAÇÃO', 'R$ 16.500,00'));
    const { qtd } = await parseMenezes(`<html><body>${one}</body></html>`, 'menezesimobi.com.br - Alugar', HOST);
    expect(qtd).toBe(1);
    expect((await parseMenezes('<html></html>', 'menezesimobi.com.br - Comprar', HOST)).imoveis).toEqual([]);
  });

  it('registra venda e aluguel com paginacao por /pagina-N/ e adapter ligado ao proprio nome', async () => {
    const [venda, aluguel] = menezes;
    expect([venda.name, aluguel.name]).toEqual(['menezesimobi.com.br - Comprar', 'menezesimobi.com.br - Alugar']);
    expect(venda.getPaginateParams(3)).toEqual({ url: `${HOST}/comprar/pagina-3/` });
    expect(aluguel.getPaginateParams(1)).toEqual({ url: `${HOST}/alugar/` });
    const html = page([card('/alugar/sp/franca/centro/barracao/7', price('LOCAÇÃO', 'R$ 16.500,00'))]);
    expect((await aluguel.adapter(html)).imoveis[0].site).toBe('menezesimobi.com.br - Alugar');
    const names = sites.map(s => s.name);
    menezes.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
  });
});
