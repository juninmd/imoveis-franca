import bamboo, { parseBamboo } from '../src/sites/bamboonegociosimobiliarios';
import { sites } from '../src/sites';

const card = (over: { heading?: string; price?: string; path?: string; desc?: string; counts?: string } = {}) => `
<div class="row center-content">
  <div class="col-md-4"><a href="${over.path ?? '/detalhes-do-imovel?Casa-Centro-Franca/SP@1'}"><figure><img src="https://cdn.example.com/a.jpg"></figure></a></div>
  <div class="col-md-8">
    <h4 class="text-uppercase space20">${over.heading ?? 'Casa - Franca'}</h4>
    <h3 class="text-uppercase space20"><font>Jardim Aeroporto II</font></h3>
    <p space20"="">Código CA143 </p>
    <p class="text-uppercase space20"> ${over.price ?? 'Venda R$ 250.000,00'}<br></p>
    <p>${over.desc ?? 'Casa da frente com 100,5 m² de terreno e varanda'}</p>
    <p class="space20"><font><i class="fa fa-hotel"></i>${over.counts ?? '2 Dorm.(s) <i class="fa fa-bath"></i>1 Banh.(s) <i class="fa fa-car"></i>1 Vaga(s)'}</font></p>
  </div>
</div>`;
const page = (cards: string[], total = '15 imóveis') => `<html><body><div class="row center-content"><div class="col-md-12"><p>${total}</p>${cards.join('')}</div></div></body></html>`;

describe('bamboonegociosimobiliarios (Imoflex)', () => {
  it('le preco, metricas, imagem, codigo, area da descricao e o total do cabecalho', async () => {
    const { imoveis, qtd } = await parseBamboo(page([card()]));
    expect(qtd).toBe(15);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({
      valor: 250000, quartos: 2, banheiros: 1, vagas: 1, area: 100.5, codigo: 'CA143', tipoImovel: 'casa',
      titulo: 'Casa - Jardim Aeroporto II', imagens: ['https://cdn.example.com/a.jpg'],
      link: 'https://www.bamboonegociosimobiliarios.com.br/detalhes-do-imovel?Casa-Centro-Franca/SP@1',
    });
  });

  it('decodifica ISO-8859-1 recebido como ArrayBuffer', async () => {
    const buf = Buffer.from(page([card({ desc: 'Casa com área de lazer e piscina ampla' })]), 'latin1');
    const { imoveis } = await parseBamboo(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    expect(imoveis[0].descricao).toContain('área de lazer');
  });

  it('descarta outras cidades, sem preco e sem link; sem total cai para a contagem local', async () => {
    const { imoveis, qtd } = await parseBamboo(page([
      card({ heading: 'Casa - Rifaina' }),
      card({ price: 'Consulte' }),
      card({ path: '' }),
      card({ heading: 'Terreno - Franca', counts: '', desc: 'Terreno plano' }),
    ], 'sem total'));
    expect(imoveis).toHaveLength(1);
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({ quartos: 0, banheiros: 0, vagas: 0, area: 0, precoPorMetro: 0, tipoImovel: 'terreno' });
  });

  it('config: pagina vem de Submit=N, so venda, nome unico no registro', () => {
    expect(bamboo.name).toBe('bamboonegociosimobiliarios.com.br - Comprar');
    expect(bamboo.tipo).toBe('venda');
    expect(bamboo.getPaginateParams(2).url).toContain('PagAtual=2&Submit=2');
    expect(bamboo.getPaginateParams(1).url).toContain("filtro=where+tipo+like+%27%25venda%25%27");
    expect(sites.filter(s => s.name === bamboo.name)).toHaveLength(1);
  });
});
