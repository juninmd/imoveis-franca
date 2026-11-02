import aluvend from '../src/sites/aluvend';
import { parseFastimob } from '../src/sites/platforms/fastimob';
import { sites } from '../src/sites';

const HOST = 'https://www.aluvend.com.br';
const card = (path: string, price: string, facilities = '<li><span>2 Quarto(s)</span></li><li><span>3 Banheiro(s)</span></li><li><span>1 Garagem</span></li>', img = '<img src="https://f/1.jpg" alt=" casa centro em franca">') => `
<div class="thumbnail recent-properties-box"><a href="${path}">${img}</a>
  <div class="price">${price}</div><h3 class="location"><a href="${path}"><i></i>Centro </a></h3>
  <ul class="facilities-list">${facilities}</ul></div>`;
const page = (cards: string[], pages: number[] = []) => `<html><body>${pages.map(p => `<a href="imoveis/pagina-${p}">${p}</a>`).join('')}${cards.join('')}</body></html>`;
const VENDA = `${HOST}/imovel/vende/sp/centro/franca/casa/100`;
const ALUGA = `${HOST}/imovel/aluga/sp/centro/franca/barracao/200`;

describe('platforms/fastimob (aluvend)', () => {
  it('cada site fica so com a sua finalidade e le preco, comodos, foto, tipo e codigo', async () => {
    const html = page([card(VENDA, 'R$ 220.000,00'), card(ALUGA, 'R$ 10.000,00')], [1, 2, 6]);
    const venda = await parseFastimob(html, 'aluvend.com.br - Comprar', HOST);
    expect(venda.qtd).toBe(6 * 12);
    expect(venda.imoveis).toHaveLength(1);
    expect(venda.imoveis[0]).toMatchObject({
      valor: 220000, quartos: 2, banheiros: 3, vagas: 1, codigo: '100', tipoImovel: 'casa', endereco: 'CENTRO', titulo: 'casa - Centro',
      link: VENDA, imagens: ['https://f/1.jpg'], descricao: 'casa centro em franca',
    });
    const aluguel = await parseFastimob(html, 'aluvend.com.br - Alugar', HOST);
    expect(aluguel.imoveis.map(i => i.codigo)).toEqual(['200']);
  });

  it('descarta outras cidades, links fora do padrao e cartoes sem preco; sem paginacao conta 1 pagina', async () => {
    const out = await parseFastimob(page([
      card(`${HOST}/imovel/vende/sp/centro/pedregulho/casa/1`, 'R$ 100,00'),
      card(`${HOST}/contato`, 'R$ 100,00'),
      card(VENDA, 'Consulte'),
      card('/imovel/vende/sp/centro/franca/casa/300', 'R$ 90.000,00', '', ''),
    ]), 'aluvend.com.br - Comprar', HOST);
    expect(out.qtd).toBe(12);
    expect(out.imoveis).toHaveLength(1);
    expect(out.imoveis[0]).toMatchObject({ link: `${HOST}/imovel/vende/sp/centro/franca/casa/300`, quartos: 0, banheiros: 0, vagas: 0, imagens: [], descricao: '' });
  });

  it('config: listagem unica paginada por /imoveis/pagina-N e nomes unicos', () => {
    expect(aluvend.map(s => s.name)).toEqual(['aluvend.com.br - Comprar', 'aluvend.com.br - Alugar']);
    expect(aluvend[0].getPaginateParams(1)).toEqual({ url: `${HOST}/imoveis` });
    expect(aluvend[1].getPaginateParams(3)).toEqual({ url: `${HOST}/imoveis/pagina-3` });
    aluvend.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
