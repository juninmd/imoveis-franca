import neoka from '../src/sites/neoka';
import dinizmartins from '../src/sites/dinizmartins';
import projeto from '../src/sites/projetoimoveisfranca';
import casabella from '../src/sites/casabellafranca';
import { parseFastimob } from '../src/sites/platforms/fastimob';
import { sites } from '../src/sites';

const HOST = 'https://www.neoka.com.br';
const card = (kind: 'vende' | 'aluga', id: number, city = 'franca') => `
<div class="thumbnail recent-properties-box">
  <a href="${HOST}/imovel/${kind}/sp/centro/${city}/casa/${id}"><img src="https://img.example.com/${id}.jpg"></a>
  <div class="detail"><div class="price">R$ 250.000,00</div><h3 class="location"><a>Centro</a></h3>
  <ul class="facilities-list"><li><span>3 Quarto(s)</span></li><li><span>2 Banheiro(s)</span></li><li><span>1 Garagem</span></li></ul></div>
</div>`;
const page = (cards: string[]) => `<html><body>${cards.join('')}<a href="imoveis/pagina-9">9</a></body></html>`;

describe('Fastimob: sites migrados do parser antigo', () => {
  // O parser antigo lia /imoveis (que abre com alugueis) e descartava tudo que nao fosse venda: 0 anuncios.
  it('pagina que abre com alugueis ainda entrega as vendas de Franca, cada site com a sua finalidade', async () => {
    const html = page([card('aluga', 1), card('aluga', 2), card('vende', 3), card('vende', 4, 'cristais-paulista')]);
    const venda = await parseFastimob(html, 'neoka.com.br - Comprar', HOST);
    const aluguel = await parseFastimob(html, 'neoka.com.br - Alugar', HOST);
    expect(venda.imoveis.map(i => i.codigo)).toEqual(['3']);
    expect(aluguel.imoveis.map(i => i.codigo)).toEqual(['1', '2']);
    expect(venda.imoveis[0]).toMatchObject({ valor: 250000, quartos: 3, banheiros: 2, vagas: 1, tipoImovel: 'casa', imagens: ['https://img.example.com/3.jpg'] });
  });

  it('cada site vira o par Comprar/Alugar varrendo /imoveis/pagina-N, com nome unico no registro', () => {
    for (const [pair, host] of [[neoka, 'www.neoka.com.br'], [dinizmartins, 'www.dinizmartins.com.br'], [projeto, 'www.projetoimoveisfranca.com.br'], [casabella, 'www.casabellafranca.com.br']] as const) {
      expect(pair.map(s => s.tipo)).toEqual(['venda', 'aluguel']);
      expect(pair[0].getPaginateParams(1)).toEqual({ url: `https://${host}/imoveis` });
      expect(pair[1].getPaginateParams(3)).toEqual({ url: `https://${host}/imoveis/pagina-3` });
      pair.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
    }
  });
});
