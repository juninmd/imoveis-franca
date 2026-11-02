import beg, { adapter } from '../src/sites/begimoveissp';
import { sites } from '../src/sites';

const entry = (name: string, price: number | string, over: Record<string, unknown> = {}) => ({
  '@type': 'ListItem',
  item: {
    '@type': 'RealEstateListing', name, url: 'https://www.begimoveissp.com.br/imovel/casa-franca-3-quartos-106-m/CA10191-BA4', image: ['https://img.kenlo.io/1.jpg'],
    offers: { '@type': 'Offer', price, businessFunction: 'http://purl.org/goodrelations/v1#Sell' }, ...over,
  },
});
const page = (...blocks: unknown[]) => `<html><head>${blocks.map(b => `<script type="application/ld+json">${typeof b === 'string' ? b : JSON.stringify(b)}</script>`).join('')}</head></html>`;
const list = (...items: unknown[]) => ({ '@type': 'ItemList', itemListElement: items });

describe('begimoveissp (JSON-LD Kenlo)', () => {
  it('le tipo, bairro, area, quartos (da URL), foto, preco e codigo', async () => {
    const html = page({ '@type': 'BreadcrumbList' }, list(entry('Casa de 106 m² na Agustinho Ferrante - Residencial Zanetti - Franca - SP, à venda por R$ 490.000', 490000)));
    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({
      titulo: 'Casa - Residencial Zanetti', endereco: 'RESIDENCIAL ZANETTI', valor: 490000, area: 106, quartos: 3, tipo: 'venda', tipoImovel: 'casa',
      codigo: 'CA10191-BA4', site: 'begimoveissp.com.br', imagens: ['https://img.kenlo.io/1.jpg'], precoPorMetro: 490000 / 106,
    });
  });

  it('detecta aluguel pelo businessFunction e aceita preco em texto', async () => {
    const rent = entry('Casa de 80 m² na Rua X - Centro - Franca - SP, para alugar por R$ 2.000', '2000', { offers: { price: '2000', businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut' }, image: undefined });
    const { imoveis } = await adapter(page(list(rent)));
    expect(imoveis[0]).toMatchObject({ tipo: 'aluguel', valor: 2000, imagens: [] });
  });

  it('descarta outras cidades, sem preco e sem url; ignora JSON invalido e blocos sem lista', async () => {
    const html = page('{ nao e json', { '@type': 'RealEstateAgent' }, { '@type': 'ItemList' }, list(
      entry('Casa de 90 m² na Rua Y - Centro - Sao Paulo - SP, à venda por R$ 1', 1),
      entry('Casa de 90 m² na Rua Y - Centro - Franca - SP, à venda por R$ 0', 0),
      entry('Casa de 90 m² na Rua Y - Centro - Franca - SP, à venda', 5, { url: undefined }),
      { item: undefined },
    ));
    expect((await adapter(html)).imoveis).toEqual([]);
  });

  it('nome sem bairro estruturado nao quebra; sem area fica zerada', async () => {
    const { imoveis } = await adapter(page(list(entry('Terreno - Franca - SP, à venda por R$ 100.000', 100000, { url: 'https://www.begimoveissp.com.br/imovel/terreno/TE1' }))));
    expect(imoveis[0]).toMatchObject({ titulo: 'Terreno', endereco: '', area: 0, precoPorMetro: 0, quartos: 0 });
  });

  it('config: pagina unica de Franca para venda e aluguel, registrada uma vez', () => {
    expect(beg).toMatchObject({ tipo: 'ambos', driver: 'axios', url: 'https://www.begimoveissp.com.br/imoveis/franca' });
    expect(beg.getPaginateParams(1)).toEqual({ url: 'https://www.begimoveissp.com.br/imoveis/franca' });
    expect(sites.filter(s => s.name === 'begimoveissp.com.br')).toHaveLength(1);
  });
});
