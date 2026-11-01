import vivenda, { parseVivenda } from '../src/sites/vivendanegociosimob';
import { sites } from '../src/sites';

const card = (path: string, price: string, over: { descr?: string; thumb?: string; bairro?: string; ref?: string } = {}) => `
<dl class="gridTypeList">
  <dd class="foto-lista"><a href="${path}"><img data-src="${over.thumb ?? '/uploads/imovel/galeria/thumb-abc.jpeg'}"></a></dd>
  <dd class="det-lista"><strong><a href="${path}">Apartamento </a></strong><br>
    <span class="loc"><b>${over.bairro ?? 'Jardim Três Colinas'}</b> / <b>Franca - SP</b></span>
    <span class="cr">Cód. Referência: <b>${over.ref ?? 'JA1030'}</b></span>
    <p class="descr">${over.descr ?? 'Apartamento com 66 m² de área útil, 2 dormitórios, 3 banheiros, 1 Vaga de Garagem.'}</p></dd>
  <dd class="pr-lista">${price}</dd>
</dl>`;
const price = (v: string) => `<span class="valorImovel"><small>Venda</small><b>${v}</b></span>`;
const page = (cards: string[], pags: number[] = []) => `<html><body>${pags.map(p => `<a href="/secao/venda?pag=${p}#all">${p}</a>`).join('')}<div class="lista-imoveis">${cards.join('')}</div></body></html>`;

describe('vivendanegociosimob (ISO-8859-1)', () => {
  it('le preco, bairro, area/quartos/banheiros/vagas da descricao, referencia e foto cheia', async () => {
    const html = page([card('/detalhes-imovel/820-x.html', price('R$ 340.000,00'))], [2, 3, 7]);
    const { imoveis, qtd } = await parseVivenda(html, 'vivendanegociosimob.com.br - Comprar');
    expect(qtd).toBe(7 * 30);
    expect(imoveis[0]).toMatchObject({
      valor: 340000, area: 66, quartos: 2, banheiros: 3, vagas: 1, codigo: 'JA1030', tipoImovel: 'apartamento', precoPorMetro: 340000 / 66,
      titulo: 'Apartamento - Jardim Três Colinas', endereco: 'JARDIM TRES COLINAS', link: 'https://www.vivendanegociosimob.com.br/detalhes-imovel/820-x.html',
      imagens: ['https://www.vivendanegociosimob.com.br/uploads/imovel/galeria/big-abc.jpeg'],
    });
  });

  it('decodifica bytes latin1 (acentos) quando o corpo vem como buffer', async () => {
    const bytes = Buffer.from(page([card('/d/1.html', price('R$ 1.500,00'), { bairro: 'São José' })]), 'latin1');
    const { imoveis } = await parseVivenda(bytes, 'v - Alugar');
    expect(imoveis[0].endereco).toBe('SAO JOSE');
    expect(imoveis[0].titulo).toBe('Apartamento - São José');
  });

  it('descarta cartoes sem link ou sem preco; sem paginacao conta 1 pagina; sem foto e sem metricas zera', async () => {
    const html = page([
      card('', price('R$ 100,00')),
      card('/d/2.html', price('Consulte')),
      card('/d/3.html', price('R$ 900,00'), { descr: 'Sala comercial', thumb: '' }),
    ]);
    const { imoveis, qtd } = await parseVivenda(html, 'v');
    expect(qtd).toBe(30);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ imagens: [], area: 0, quartos: 0, banheiros: 0, vagas: 0, precoPorMetro: 0 });
  });

  it('config: GET em arraybuffer, paginacao por ?pag= e registro unico por finalidade', async () => {
    const [venda, aluguel] = vivenda;
    expect([venda.name, aluguel.name]).toEqual(['vivendanegociosimob.com.br - Comprar', 'vivendanegociosimob.com.br - Alugar']);
    expect(venda).toMatchObject({ driver: 'axios_rest', method: 'GET', tipo: 'venda', itemsPerPage: 30, axiosConfig: { responseType: 'arraybuffer' } });
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://www.vivendanegociosimob.com.br/secao/venda' });
    expect(aluguel.getPaginateParams(3)).toEqual({ url: 'https://www.vivendanegociosimob.com.br/secao/aluguel?pag=3' });
    const names = sites.map(s => s.name);
    vivenda.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
    const out = await aluguel.adapter(page([card('/d/4.html', price('R$ 1.000,00'))]) as never) as unknown as { imoveis: Array<{ site: string }> };
    expect(out.imoveis[0].site).toBe('vivendanegociosimob.com.br - Alugar');
  });
});
