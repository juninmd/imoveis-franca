import jresende, { parseJResende } from '../src/sites/jresendeimoveis';
import { sites } from '../src/sites';

const card = (path: string, prices: string, over: { descr?: string; dorm?: string; imgs?: number } = {}) => `
<div class="card card-imo">
  <div class="carousel carousel-main">${Array.from({ length: over.imgs ?? 2 }, (_v, i) => `<a class="carousel-cell" href="${path}"><img data-flickity-lazyload-src="https://cdn/${i}.webp"></a>`).join('')}</div>
  <div class="cod-imovel"><div>Cód. <strong>1356</strong></div></div>
  <div class="card-valores">${prices}</div>
  <h2 class="card-titulo">VENDA apto Edifício The One</h2>
  <div class="card-bairro-cidade-texto">JARDIM CONSOLAÇÃO - FRANCA/SP</div>
  <div class="card-texto"><p>${over.descr ?? 'Apartamento com 68 m2, sala estendida'}</p></div>
  <div class="imo-dad-compl">${over.dorm ?? '<div class="dorm-ico"><span></span><span>1</span></div><div class="banh-ico"><span></span><span>2</span></div><div class="gar-ico"><span></span><span>2</span></div>'}</div>
</div>`;
const prices = '<div>R$ 2.800,00 L</div><div><div><small><del>R$ 550.000,00</del></small></div>R$ 549.000,00 V</div>';
const page = (...cards: string[]) => `<html><body><div class="lista-imoveis">${cards.join('')}</div></body></html>`;
const P = '/comprar/FRANCA/Apartamento/Padrao/JARDIM-CONSOLACAO/1356';

describe('jresendeimoveis (Kurole, ISO-8859-1)', () => {
  it('venda usa o preco V (ignorando o preco antigo riscado) e le fotos, comodos, area e codigo', async () => {
    const { imoveis, qtd } = await parseJResende(page(card(P, prices)), 'jresendeimoveis.com.br - Comprar', 'venda');
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({
      valor: 549000, area: 68, quartos: 1, banheiros: 2, vagas: 2, codigo: '1356', tipoImovel: 'apartamento', endereco: 'JARDIM CONSOLACAO',
      titulo: 'VENDA apto Edifício The One', link: `https://www.jresendeimoveis.com.br${P}`, imagens: ['https://cdn/0.webp', 'https://cdn/1.webp'], precoPorMetro: 549000 / 68,
    });
  });

  it('aluguel usa o preco L do mesmo cartao; decodifica bytes latin1', async () => {
    const bytes = Buffer.from(page(card(P, prices)), 'latin1');
    const { imoveis } = await parseJResende(bytes, 'jresendeimoveis.com.br - Alugar', 'aluguel');
    expect(imoveis[0].valor).toBe(2800);
    expect(imoveis[0].titulo).toBe('VENDA apto Edifício The One');
  });

  it('descarta outras cidades, cartoes sem o preco da finalidade e sem link; metricas ausentes zeram', async () => {
    const html = page(
      card('/comprar/RIBEIRAO-PRETO/Casa/Padrao/X/9', prices),
      card(P, '<div>R$ 2.800,00 L</div>'),
      card('', prices),
      card(P, '<div>R$ 100.000,00 V</div>', { descr: 'Sala', dorm: '', imgs: 1 }),
    );
    const { imoveis } = await parseJResende(html, 'j - Comprar', 'venda');
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ valor: 100000, area: 0, quartos: 0, banheiros: 0, vagas: 0, imagens: ['https://cdn/0.webp'], precoPorMetro: 0 });
  });

  it('config: uma pagina por finalidade, GET em arraybuffer, registro unico', async () => {
    const [venda, aluguel] = jresende;
    expect([venda.name, aluguel.name]).toEqual(['jresendeimoveis.com.br - Comprar', 'jresendeimoveis.com.br - Alugar']);
    expect(venda).toMatchObject({ driver: 'axios_rest', method: 'GET', tipo: 'venda', axiosConfig: { responseType: 'arraybuffer' } });
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://www.jresendeimoveis.com.br/comprar/FRANCA' });
    expect(aluguel.getPaginateParams(2)).toEqual({ url: 'https://www.jresendeimoveis.com.br/alugar/FRANCA' });
    const names = sites.map(s => s.name);
    jresende.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
    const out = await aluguel.adapter(page(card(P, prices)) as never) as unknown as { imoveis: Array<{ site: string }> };
    expect(out.imoveis[0].site).toBe('jresendeimoveis.com.br - Alugar');
  });
});
