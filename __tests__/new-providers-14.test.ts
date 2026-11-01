import nb from '../src/sites/nbimobiliaria';
import { parseNb } from '../src/sites/nbimobiliaria';
import { sites } from '../src/sites';

const card = (id: string, label: string, price: string, thumb = 'assets/img/imoveis/pequena/0113021620.jpg') => `
<div class="col-md-4"><div class="imovel">
  <div class="appartment-img"><a href="exibeimovel.asp?imovel=${id}"><img src="${thumb}"></a></div>
  <div class="property-text"><div class="appartment-name"><h5>${label}</h5></div>
  <div class="property-price"><a href="exibeimovel.asp?imovel=${id}"><h4>${price}</h4></a></div></div>
</div></div>`;
const page = (...cards: string[]) => `<html><body><section id="imoveis">${cards.join('')}</section></body></html>`;

describe('nbimobiliaria (ASP classico)', () => {
  it('le bairro, tipo, preco, codigo e troca a miniatura pela foto cheia', async () => {
    const { imoveis, qtd } = await parseNb(page(card('1302', 'Bairro: SANTA CRUZ | Finalidade: <span>APARTAMENTO</span>', 'Valor R$1.150,00')), 'nb - Alugar');
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({
      valor: 1150, titulo: 'APARTAMENTO - SANTA CRUZ', endereco: 'SANTA CRUZ', codigo: '1302', tipoImovel: 'apartamento', site: 'nb - Alugar',
      link: 'https://nbimobiliaria.com.br/exibeimovel.asp?imovel=1302', imagens: ['https://nbimobiliaria.com.br/assets/img/imoveis/grande/0113021620.jpg'],
    });
  });

  it('descarta cartoes sem preco ou sem link; sem foto e sem tipo seguem validos', async () => {
    const html = page(
      card('1', 'Bairro: CENTRO | Finalidade: <span>CASA</span>', 'Consulte'),
      card('2', 'Bairro: CENTRO | Finalidade: <span>CASA</span>', 'Valor R$760,00').replace(/exibeimovel\.asp\?imovel=2/g, '#'),
      card('3', 'Bairro: NICACIO', 'Valor R$900,00', ''),
    );
    const { imoveis } = await parseNb(html, 'nb');
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ titulo: 'NICACIO', imagens: [], tipoImovel: undefined, codigo: '3' });
  });

  it('config: uma pagina por finalidade (V/L) e registro unico', async () => {
    const [venda, aluguel] = nb;
    expect([venda.name, aluguel.name]).toEqual(['nbimobiliaria.com.br - Comprar', 'nbimobiliaria.com.br - Alugar']);
    expect(venda.getPaginateParams(1)).toEqual({ url: 'https://nbimobiliaria.com.br/imoveis.asp?negocio=V' });
    expect(aluguel.getPaginateParams(2)).toEqual({ url: 'https://nbimobiliaria.com.br/imoveis.asp?negocio=L' });
    const names = sites.map(s => s.name);
    nb.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
    const out = await aluguel.adapter(page(card('4', 'Bairro: CENTRO | Finalidade: <span>CASA</span>', 'Valor R$760,00')) as never) as unknown as { imoveis: Array<{ site: string }> };
    expect(out.imoveis[0].site).toBe('nbimobiliaria.com.br - Alugar');
  });
});
