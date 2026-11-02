import imovelweb, { adapter as imovelwebAdapter } from '../src/sites/imovelweb';
import vivareal, { adapter as vivarealAdapter } from '../src/sites/vivareal';
import ferreira, { adapter as ferreiraAdapter } from '../src/sites/ferreiraferreiraimob';
import { sites } from '../src/sites';

const naventCard = `
<div><div data-qa="POSTING_CARD_GALLERY"><img alt="Casa · 120m² · Casa à venda" src="https://imgbr.imovelwebcdn.com/a.jpg"></div>
  <h2 data-qa="POSTING_CARD_PRICE">R$ 650.000</h2>
  <h3 data-qa="POSTING_CARD_FEATURES"><span>120 m² tot.</span><span>3 quartos</span></h3>
  <h4 data-qa="POSTING_CARD_LOCATION">Franca Pólo Club, Franca</h4>
  <h2 data-qa="POSTING_CARD_DESCRIPTION"><a href="/propriedades/casa-a-venda-3034860488.html?n_src=Listado">Casa ampla</a></h2>
</div>`;

const vivaCard = `<ul><li data-cy="rp-property-cd">
  <a href="https://www.vivareal.com.br/imovel/apartamento-2-quartos-centro-id-2897789893/?source=ranking" title="Apartamento para comprar com 54 m², 2 quartos">
    <img src="https://resizedimgs.vivareal.com/a.webp?dimension=614x297">
    <div data-cy="rp-cardProperty-price-txt">R$ 245.000</div>
    <div data-cy="rp-cardProperty-location-txt">Centro, Franca</div>
  </a></li></ul>`;

describe('imovelweb (grupo Navent, mesmo parser da Casamineira)', () => {
  it('le o card e resolve o link relativo contra o host do portal', async () => {
    const { imoveis } = await imovelwebAdapter(`<h1>3.889 Imóveis à venda em Franca, SP</h1>${naventCard}`);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({
      valor: 650000, areaTotal: 120, quartos: 3, endereco: 'FRANCA POLO CLUB', tipoImovel: 'casa',
      link: 'https://www.imovelweb.com.br/propriedades/casa-a-venda-3034860488.html', site: 'imovelweb.com.br',
    });
  });

  it('usa Chromium, tem teto de paginas e URLs de venda e aluguel com paginacao -pagina-N.html', () => {
    expect(imovelweb.map(s => [s.name, s.tipo, s.driver])).toEqual([
      ['imovelweb.com.br - Comprar', 'venda', 'puppet'],
      ['imovelweb.com.br - Alugar', 'aluguel', 'puppet'],
    ]);
    expect(imovelweb[0].getPaginateParams(1).url).toBe('https://www.imovelweb.com.br/imoveis-venda-franca-sp.html');
    expect(imovelweb[1].getPaginateParams(3).url).toBe('https://www.imovelweb.com.br/imoveis-aluguel-franca-sp-pagina-3.html');
    expect(imovelweb[0].maxPages).toBeLessThanOrEqual(30);
  });

  it('o adapter registrado grava o nome do site e o host nos anuncios', async () => {
    const { imoveis } = await imovelweb[1].adapter(naventCard);
    expect(imoveis[0]).toMatchObject({ site: 'imovelweb.com.br - Alugar', link: expect.stringContaining('https://www.imovelweb.com.br/') });
  });
});

describe('vivareal (grupo ZAP, mesmo parser do ZAP)', () => {
  it('le o card, aceita link absoluto e amplia a miniatura', async () => {
    const { imoveis } = await vivarealAdapter(`<h1>5.349 Imóveis para venda em França - SP</h1>${vivaCard}`);
    expect(imoveis[0]).toMatchObject({
      valor: 245000, endereco: 'CENTRO', tipoImovel: 'apartamento', codigo: '2897789893', site: 'vivareal.com.br',
      link: 'https://www.vivareal.com.br/imovel/apartamento-2-quartos-centro-id-2897789893/',
    });
    expect(imoveis[0].imagens[0]).toContain('dimension=800x600');
  });

  it('usa Chromium e URLs de venda e aluguel com ?pagina=N', () => {
    expect(vivareal.map(s => [s.name, s.driver])).toEqual([['vivareal.com.br - Comprar', 'puppet'], ['vivareal.com.br - Alugar', 'puppet']]);
    expect(vivareal[0].getPaginateParams(1).url).toBe('https://www.vivareal.com.br/venda/sp/franca/');
    expect(vivareal[1].getPaginateParams(2).url).toBe('https://www.vivareal.com.br/aluguel/sp/franca/?pagina=2');
  });

  it('o adapter registrado usa o nome do site', async () => {
    const { imoveis } = await vivareal[0].adapter(vivaCard);
    expect(imoveis[0].site).toBe('vivareal.com.br - Comprar');
  });
});

const ferreiraCatalog = `# Imobiliária Ferreira Ferreira

## Imóveis em destaque

Total de imóveis disponíveis: 3

### Casa - 752

- Referência: 752
- Tipo: Casa
- Finalidade: venda
- Bairro: Esplanada Primo Meneghetti II
- Valor: R$ 930.000
**Características:**

- Básicas:
  - Dormitórios: 3
  - Banheiros: 2
  - Vagas de garagem: 2
- Áreas:
  - Área do terreno: 180 m²
  - Área construída: 142,88 m²
- Descrição: Casa à venda. Terreno: 999 m² e Área construída: 111 m² no texto livre.
**Imagens:**

- ![Imagem 1 (principal)](http://www.ferreiraferreiraimob.com.br/imagens/imoveis/1.jpeg)
- ![Imagem 2](http://www.ferreiraferreiraimob.com.br/imagens/imoveis/2.jpeg)

[Ver imóvel completo](http://www.ferreiraferreiraimob.com.br/imovel/4498011/casa-venda-esplanada)

### Apartamento - 9

- Referência: 9
- Tipo: Apartamento
- Finalidade: locação
- Bairro: Centro
- Valor: R$ 800
**Características:**

- Áreas:
  - Área do terreno: 50 m²

[Ver imóvel completo](http://www.ferreiraferreiraimob.com.br/imovel/4496512/apartamento-locacao)

### Terreno - 8

- Tipo: Terreno
- Finalidade: permuta
- Valor: Consulte

[Ver imóvel completo](http://www.ferreiraferreiraimob.com.br/imovel/1/terreno)

### Casa - 7

- Valor: R$ 100.000
`;

describe('ferreiraferreiraimob (catalogo /llms.txt)', () => {
  it('le detalhes, todas as fotos e a descricao de cada bloco', async () => {
    const { imoveis, qtd } = await ferreiraAdapter(ferreiraCatalog);
    expect(qtd).toBe(2);
    expect(imoveis[0]).toMatchObject({
      titulo: 'Casa - Esplanada Primo Meneghetti II', valor: 930000, quartos: 3, banheiros: 2, vagas: 2,
      area: 142.88, areaTotal: 180, endereco: 'ESPLANADA PRIMO MENEGHETTI II', codigo: '752', tipo: 'venda', tipoImovel: 'casa',
      link: 'https://www.ferreiraferreiraimob.com.br/imovel/4498011/casa-venda-esplanada',
    });
    expect(imoveis[0].imagens).toHaveLength(2);
    expect(imoveis[0].descricao).toContain('Casa à venda');
  });

  it('metragem vem das linhas estruturadas, nao do texto livre da descricao', async () => {
    const { imoveis } = await ferreiraAdapter(ferreiraCatalog);
    expect(imoveis[0].areaTotal).toBe(180);
    expect(imoveis[0].area).toBe(142.88);
  });

  it('classifica locacao como aluguel; sem area construida usa o terreno; sem fotos fica sem imagens', async () => {
    const { imoveis } = await ferreiraAdapter(ferreiraCatalog);
    expect(imoveis[1]).toMatchObject({ tipo: 'aluguel', valor: 800, area: 50, areaTotal: 50, imagens: [], tipoImovel: 'apartamento' });
  });

  it('descarta blocos sem link ou sem preco; finalidade desconhecida fica sem tipo', async () => {
    const odd = '### Casa - 1\n\n- Finalidade: permuta\n- Valor: R$ 10\n\n[Ver imóvel completo](http://x.com/imovel/1/a)\n';
    const { imoveis } = await ferreiraAdapter(`${ferreiraCatalog}\n${odd}`);
    expect(imoveis).toHaveLength(3);
    expect(imoveis[2].tipo).toBeUndefined();
  });

  it('texto sem blocos devolve vazio', async () => {
    expect(await ferreiraAdapter('# so cabecalho')).toMatchObject({ imoveis: [], qtd: 0 });
  });

  it('busca tudo numa pagina so, de qualquer finalidade', () => {
    expect(ferreira.tipo).toBe('ambos');
    expect(ferreira.getPaginateParams(1).url).toBe('https://www.ferreiraferreiraimob.com.br/llms.txt');
  });
});

describe('registro (2)', () => {
  it('registra cada novo provider exatamente uma vez', () => {
    const names = sites.map(s => s.name);
    ['imovelweb.com.br - Comprar', 'imovelweb.com.br - Alugar', 'vivareal.com.br - Comprar', 'vivareal.com.br - Alugar', 'ferreiraferreiraimob.com.br']
      .forEach(name => expect(names.filter(n => n === name)).toHaveLength(1));
  });
});
