import matriz, { parseMatriz } from '../src/sites/matriz';
import { sites } from '../src/sites';

const HOST = 'https://matrizimobiliaria.com.br';
const metricBox = (label: string, value: string) =>
  `<div><span>${label}</span><span>${value}</span></div>`;
const card = (o: { titulo?: string; preco?: string; link?: string; codigo?: string; metrics?: string; img?: string } = {}) => `
<div class="bento-card card-imovel" ${o.codigo === undefined ? 'data-codigo="5417"' : o.codigo ? `data-codigo="${o.codigo}"` : ''}>
  ${o.link === '' ? '' : `<a href="${o.link ?? `${HOST}/imovel/apartamento-jardim-natal-i-franca-5417`}" class="card-imovel__link"></a>`}
  <div class="card-imovel__foto"><img class="card-imovel__img" src="${o.img ?? 'https://matrizimobiliaria.com.br/foto/960/5417/a.jpg.webp'}" alt="Apartamento à venda"></div>
  <div class="card-imovel__corpo">
    <h3 class="card-imovel__titulo">${o.titulo ?? 'Jardim Natal I'}</h3><span class="card-imovel__categoria">Apartamento</span>
    <div class="card-imovel__precos"><p class="card-imovel__preco">${o.preco ?? 'R$&nbsp;345.000 <span>Venda</span>'}</p></div>
    <div class="grid">${o.metrics ?? `${metricBox('Quartos', '2')}${metricBox('Vagas', '2')}${metricBox('Área', '78,5 m²')}`}</div>
  </div>
</div>`;
const page = (cards: string[], last = 34) => `<html><body>${cards.join('')}${last > 0 ? `<a href="${HOST}/imoveis/venda/todos?pagina=2">2</a><a href="${HOST}/imoveis/venda/todos?pagina=${last}">${last}</a>` : ''}</body></html>`;

describe('matrizimobiliaria.com.br (Vista, template card-imovel)', () => {
  it('le preco, quartos, vagas, area, codigo, imagem e total pela ultima pagina', async () => {
    const { imoveis, qtd } = await parseMatriz(page([card()]), 'matrizimobiliaria.com.br - Comprar', HOST);
    expect(qtd).toBe(34 * 24);
    expect(imoveis[0]).toMatchObject({
      valor: 345000, quartos: 2, vagas: 2, area: 78.5, codigo: '5417', tipoImovel: 'apartamento', endereco: 'JARDIM NATAL I',
      titulo: 'Apartamento - Jardim Natal I', imagens: ['https://matrizimobiliaria.com.br/foto/960/5417/a.jpg.webp'],
      link: `${HOST}/imovel/apartamento-jardim-natal-i-franca-5417`, precoPorMetro: 345000 / 78.5,
    });
  });

  // Os cartoes de Franca vem sem cidade ("Jardim Natal I"); so os das outras cidades trazem ", Cidade".
  it('o titulo sem cidade e Franca; ", Cidade" de outra cidade e descartado', async () => {
    const { imoveis } = await parseMatriz(page([
      card({ titulo: 'Centro' }),
      card({ titulo: 'Jardim Olhos D´Água, Ribeirão Preto', link: `${HOST}/imovel/x-ribeirao-preto-1` }),
      card({ titulo: 'Centro, Franca', link: `${HOST}/imovel/y-franca-2` }),
    ]), 'm - Comprar', HOST);
    expect(imoveis.map(i => i.endereco)).toEqual(['CENTRO', 'CENTRO']);
  });

  it('descarta "preco sob consulta" e cartao sem link; aceita link relativo, sem codigo e sem metricas', async () => {
    const { imoveis, qtd } = await parseMatriz(page([
      card({ preco: 'Preço sob consulta' }),
      card({ link: '' }),
      card({ link: '/imovel/rel-3', codigo: '', metrics: '' }),
    ], 0), 'm - Comprar', HOST);
    expect(imoveis).toHaveLength(1);
    expect(qtd).toBe(24);
    expect(imoveis[0]).toMatchObject({ link: `${HOST}/imovel/rel-3`, quartos: 0, vagas: 0, area: 0, precoPorMetro: 0, codigo: '' || undefined });
  });

  it('config: /imoveis/<venda|aluguel>/todos com ?pagina=N, nomes unicos e sem o registro duplicado', () => {
    expect(matriz.map(s => s.name)).toEqual(['matrizimobiliaria.com.br - Comprar', 'matrizimobiliaria.com.br - Alugar']);
    expect(matriz[0].getPaginateParams(1)).toEqual({ url: `${HOST}/imoveis/venda/todos` });
    expect(matriz[1].getPaginateParams(3)).toEqual({ url: `${HOST}/imoveis/aluguel/todos?pagina=3` });
    matriz.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
