import liporoni, { adapter as liporoniAdapter } from '../src/sites/imobiliariafabioliporoni';
import casamineira, { adapter as casamineiraAdapter } from '../src/sites/casamineira';
import zap, { adapter as zapAdapter } from '../src/sites/zapimoveis';
import olx, { adapter as olxAdapter } from '../src/sites/olx';
import estillo from '../src/sites/imobiliariaestillo';
import { sites } from '../src/sites';

const liporoniHtml = `
<a href="/comprar/sp/franca/jardim-paulistano/casa/9476197">
  <div id="9476197" class="resultado resultado_grade">
    <div class="foto"><img src="https://static.tokkobroker.com/pictures/1.jpg"></div>
    <div class="dados">
      <h3 class="tipo">Casa - Jardim Paulistano</h3>
      <h4 class="localizacao"><span>Jardim Paulistano - Franca/SP</span></h4>
      <div class="detalhes">
        <div class="detalhe"><span>2<span> dormitórios</span></span></div>
        <div class="detalhe"><span>1<span> banheiro</span></span></div>
        <div class="detalhe"><span>2<span> vagas</span></span></div>
        <div class="detalhe"><span>250.00</span><span> m² total </span><span>122.28</span><span> m² útil</span></div>
      </div>
      <div class="descricao"><span>Casa usada com edícula.</span></div>
      <div class="valor"><h5>R$ 200.000,00</h5></div>
      <div class="referencia"><span>CA01278</span></div>
    </div>
  </div>
</a>
<a href="/comprar/sp/franca/centro/terreno/9476745">
  <div class="resultado"><div class="dados">
    <h3 class="tipo">Terreno - Centro</h3>
    <h4 class="localizacao"><span>Centro - Franca/SP</span></h4>
    <div class="detalhes"><div class="detalhe"><span>200.00</span><span> m² terreno</span></div></div>
    <div class="valor"><h5>R$ 142.000,00</h5></div>
  </div></div>
</a>
<div class="resultado"><h3 class="tipo">Sem link</h3><div class="valor"><h5>R$ 1,00</h5></div></div>
<a href="/x"><div class="resultado"><h3 class="tipo">Sem preço</h3><div class="valor"><h5>Consulte</h5></div></div></a>
<a href="javascript: paginacao('/comprar/sp/franca/pagina-2/');">2</a>
<a href="javascript: paginacao('/comprar/sp/franca/pagina-9/');">9</a>
<a href="javascript: paginacao('/comprar/sp/franca/pagina-3/');">»</a>
`;

describe('imobiliariafabioliporoni', () => {
  it('extrai detalhes, imagem, codigo, areas e total de paginas', async () => {
    const { imoveis, qtd } = await liporoniAdapter(liporoniHtml);
    expect(qtd).toBe(9 * 12);
    expect(imoveis).toHaveLength(2);
    expect(imoveis[0]).toMatchObject({
      titulo: 'Casa - Jardim Paulistano',
      endereco: 'JARDIM PAULISTANO',
      valor: 200000,
      area: 122.28,
      areaTotal: 250,
      quartos: 2,
      banheiros: 1,
      vagas: 2,
      codigo: 'CA01278',
      tipoImovel: 'casa',
      link: 'https://imobiliariafabioliporoni.com.br/comprar/sp/franca/jardim-paulistano/casa/9476197',
      imagens: ['https://static.tokkobroker.com/pictures/1.jpg'],
    });
    expect(imoveis[0].precoPorMetro).toBeCloseTo(200000 / 122.28);
  });

  it('terreno: area util cai para a area total e sem imagem fica sem imagens', async () => {
    const { imoveis } = await liporoniAdapter(liporoniHtml);
    expect(imoveis[1]).toMatchObject({ area: 200, areaTotal: 200, tipoImovel: 'terreno', imagens: [], codigo: undefined });
  });

  it('sem paginacao usa a quantidade de cards; aceita link absoluto', async () => {
    const html = '<a href="https://imobiliariafabioliporoni.com.br/a"><div class="resultado"><div class="valor"><h5>R$ 10,00</h5></div></div></a>';
    const { imoveis, qtd } = await liporoniAdapter(html);
    expect(qtd).toBe(1);
    expect(imoveis[0].link).toBe('https://imobiliariafabioliporoni.com.br/a');
  });

  it('bloco de detalhe sem span nao derruba a pagina inteira', async () => {
    const html = '<a href="/a"><div class="resultado"><div class="detalhes"><div class="detalhe">3 dormitórios</div></div><div class="valor"><h5>R$ 10,00</h5></div></div></a>';
    const { imoveis } = await liporoniAdapter(html);
    expect(imoveis[0].quartos).toBe(0);
  });

  it('pagina pelo path /pagina-N/', () => {
    expect(liporoni.getPaginateParams(1).url).toBe('https://imobiliariafabioliporoni.com.br/comprar/sp/franca/');
    expect(liporoni.getPaginateParams(3).url).toBe('https://imobiliariafabioliporoni.com.br/comprar/sp/franca/pagina-3/');
  });
});

const card = (opts: { price: string; href: string; features?: string; location?: string; alt?: string }) => `
<div><div data-qa="POSTING_CARD_GALLERY"><img alt="${opts.alt ?? 'Casa à venda'}" src="https://imgbr.imovelwebcdn.com/a.jpg"><img src="https://imgbr.imovelwebcdn.com/b.jpg"></div>
  <h2 data-qa="POSTING_CARD_PRICE">${opts.price}</h2>
  <h3 data-qa="POSTING_CARD_FEATURES">${opts.features ?? ''}</h3>
  <h4 data-qa="POSTING_CARD_LOCATION">${opts.location ?? 'Jardim Piratininga, Franca'}</h4>
  <h2 data-qa="POSTING_CARD_DESCRIPTION"><a href="${opts.href}">Descrição longa do anúncio</a></h2>
</div>`;

describe('casamineira', () => {
  const html = `<h1>1.055 imóveis à venda em Franca - SP</h1>
    ${card({ price: 'R$ 980.000', href: '/imovel/venda/casa-3-quartos/3040683957?n_src=Listado&n_pg=1', alt: 'Casa · 120m² · Casa à venda',
      features: '<span>490 m² tot.</span><span>120 m² úteis</span><span>3 quartos</span><span>2 banhos</span><span>2 vagas</span><span>sem match</span>' })}
    ${card({ price: 'Consulte', href: '/imovel/venda/sem-preco/1' })}
    ${card({ price: 'R$ 500', href: '' })}
    ${card({ price: 'R$ 250.000', href: '/imovel/venda/terreno-a-venda/3040683999', alt: '', features: '<span>300 m² tot.</span>' })}`;

  it('extrai os campos do card e remove tracking da URL', async () => {
    const { imoveis, qtd } = await casamineiraAdapter(html);
    expect(qtd).toBe(1055);
    expect(imoveis).toHaveLength(2);
    expect(imoveis[0]).toMatchObject({
      valor: 980000, area: 120, areaTotal: 490, quartos: 3, banheiros: 2, vagas: 2,
      endereco: 'JARDIM PIRATININGA', codigo: '3040683957', tipoImovel: 'casa',
      link: 'https://www.casamineira.com.br/imovel/venda/casa-3-quartos/3040683957',
      imagens: ['https://imgbr.imovelwebcdn.com/a.jpg', 'https://imgbr.imovelwebcdn.com/b.jpg'],
    });
  });

  it('sem alt usa a descricao como titulo e area util cai para total', async () => {
    const { imoveis } = await casamineiraAdapter(html);
    expect(imoveis[1]).toMatchObject({ titulo: 'Descrição longa do anúncio', area: 300, areaTotal: 300 });
  });

  it('gera um site de venda e um de aluguel, com paginacao /pagina-N e teto de paginas', () => {
    expect(casamineira.map(s => s.tipo)).toEqual(['venda', 'aluguel']);
    expect(casamineira[1].name).toBe('casamineira.com.br - Alugar');
    expect(casamineira[0].getPaginateParams(1).url).toBe('https://www.casamineira.com.br/venda/imovel/franca_sp');
    expect(casamineira[1].getPaginateParams(4).url).toBe('https://www.casamineira.com.br/aluguel/imovel/franca_sp/pagina-4');
    expect(casamineira[0].maxPages).toBeLessThanOrEqual(40);
  });

  it('o adapter do site grava o nome do site no anuncio', async () => {
    const { imoveis } = await casamineira[1].adapter(html);
    expect(imoveis[0].site).toBe('casamineira.com.br - Alugar');
  });

  it('pagina sem cards devolve vazio', async () => {
    expect(await casamineiraAdapter('<html></html>')).toMatchObject({ imoveis: [], qtd: 0 });
  });

  it('href invalido descarta so aquele card; faixas e decimais leem o primeiro numero', async () => {
    const page = card({ price: 'R$ 100.000', href: 'http://' })
      + card({ price: 'R$ 300.000', href: '/imovel/venda/x/9', features: '<span>2 a 3 quartos</span><span>120,5 m²</span><span>1.200 m² tot.</span>' });
    const { imoveis } = await casamineiraAdapter(page);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ quartos: 2, area: 121, areaTotal: 1200 });
  });
});

const zapCard = (opts: { href: string; price: string; location: string; title?: string; street?: string }) => `
<ul><li data-cy="rp-property-cd">
  <a href="${opts.href}" title="${opts.title ?? 'Apartamento para comprar com 54 m², 2 quartos'}">
    <img src="https://resizedimgs.zapimoveis.com.br/a.webp?action=fit-in&dimension=614x297">
    <img src="https://resizedimgs.zapimoveis.com.br/b.webp?action=fit-in&dimension=614x297">
    <div data-cy="rp-cardProperty-price-txt">${opts.price}</div>
    <div data-cy="rp-cardProperty-propertyArea-txt">Tamanho do imóvel 54 m²</div>
    <div data-cy="rp-cardProperty-bedroomQuantity-txt">Quantidade de quartos 2</div>
    <div data-cy="rp-cardProperty-bathroomQuantity-txt">Quantidade de banheiros 1</div>
    <div data-cy="rp-cardProperty-parkingSpacesQuantity-txt">Quantidade de vagas de garagem 2</div>
    <div data-cy="rp-cardProperty-location-txt">${opts.location}</div>
    <div data-cy="rp-cardProperty-street-txt">${opts.street ?? 'Endereço não informado'}</div>
  </a>
</li></ul>`;

describe('zapimoveis', () => {
  const html = `<h1>5.350 Imóveis para venda em França - SP</h1>
    ${zapCard({ href: 'https://www.zapimoveis.com.br/imovel/venda-apartamento-id-2897789893/?source=ranking', price: 'R$ 245.000Cond. R$ 180 • IPTU não informado', location: 'Centro, Franca' })}
    ${zapCard({ href: 'https://www.zapimoveis.com.br/imovel/venda-casa-id-1/', price: 'R$ 400.000', location: 'Centro, Ribeirão Preto' })}
    ${zapCard({ href: '/imovel/venda-casa-id-2/', price: 'Sob consulta', location: 'Centro, Franca' })}
    ${zapCard({ href: '/imovel/venda-casa-id-3/', price: 'R$ 1.200.000', location: 'Jardim Aeroporto, Franca', title: 'Casa para comprar', street: 'Rua das Flores' })}`;

  it('extrai campos, descarta cidades vizinhas e preco indefinido', async () => {
    const { imoveis, qtd } = await zapAdapter(html);
    expect(qtd).toBe(5350);
    expect(imoveis).toHaveLength(2);
    expect(imoveis[0]).toMatchObject({
      valor: 245000, area: 54, quartos: 2, banheiros: 1, vagas: 2, endereco: 'CENTRO',
      codigo: '2897789893', tipoImovel: 'apartamento',
      link: 'https://www.zapimoveis.com.br/imovel/venda-apartamento-id-2897789893/',
    });
    expect(imoveis[0].descricao).toContain('Condomínio R$ 180');
    expect(imoveis[0].imagens[0]).toContain('dimension=800x600');
  });

  it('inclui a rua na descricao quando informada; link relativo vira absoluto', async () => {
    const { imoveis } = await zapAdapter(html);
    expect(imoveis[1].descricao).toContain('Rua das Flores');
    expect(imoveis[1].link).toBe('https://www.zapimoveis.com.br/imovel/venda-casa-id-3/');
  });

  it('venda e aluguel com paginacao por query e teto de paginas', () => {
    expect(zap.map(s => s.tipo)).toEqual(['venda', 'aluguel']);
    expect(zap[0].getPaginateParams(1).url).toBe('https://www.zapimoveis.com.br/venda/imoveis/sp+franca/');
    expect(zap[1].getPaginateParams(2).url).toBe('https://www.zapimoveis.com.br/aluguel/imoveis/sp+franca/?pagina=2');
    expect(zap[0].maxPages).toBeLessThanOrEqual(30);
  });

  it('o adapter do site grava o nome do site no anuncio', async () => {
    const { imoveis } = await zap[1].adapter(html);
    expect(imoveis[0].site).toBe('zapimoveis.com.br - Alugar');
  });

  it('pagina sem cards devolve vazio', async () => {
    expect(await zapAdapter('<html></html>')).toMatchObject({ imoveis: [], qtd: 0 });
  });

  it('href invalido descarta so aquele card', async () => {
    const { imoveis } = await zapAdapter(zapCard({ href: 'http://', price: 'R$ 100.000', location: 'Centro, Franca' }));
    expect(imoveis).toHaveLength(0);
  });
});

const olxCard = (opts: { href: string; price: string; location: string; title?: string; details?: string; badge?: string }) => `
<section class="olx-adcard"><div class="olx-adcard__content">
  <a data-testid="adcard-link" title="${opts.title ?? 'Casa Condomínio Reserva dos Ipês'}" href="${opts.href}"><h2>t</h2></a>
  <div class="olx-adcard__details">${opts.details ?? `<div class="olx-adcard__detail" aria-label="220 metros quadrados">220m²</div>
    <div class="olx-adcard__detail" aria-label="3 quartos">3</div>
    <div class="olx-adcard__detail" aria-label="5 ou mais banheiros">5+</div>
    <div class="olx-adcard__detail" aria-label="3 vagas de garagem">3</div>
    <div class="olx-adcard__detail" aria-label="IPTU">x</div>`}</div>
  ${opts.badge ? `<div class="olx-core-badge">${opts.badge}</div>` : ''}
  <h3 class="olx-adcard__price">${opts.price}</h3>
  <div class="olx-adcard__price-info">Condomínio R$ 500</div>
  <p class="olx-adcard__location">${opts.location}</p>
  <div class="olx-adcard__media"><img src="https://img.olx.com.br/thumbs700x500/1.webp"></div>
</div></section>`;

describe('olx', () => {
  const html = `<body><span>4.809 resultados</span>
    ${olxCard({ href: 'https://sp.olx.com.br/regiao-de-ribeirao-preto/imoveis/casa-1548616786', price: 'R$ 2.100.000', location: 'Franca, Jardim Veneza', badge: 'Direto com o proprietário' })}
    ${olxCard({ href: 'https://sp.olx.com.br/x/imoveis/casa-2', price: 'R$ 100.000', location: 'Ribeirão Preto, Centro' })}
    ${olxCard({ href: 'https://sp.olx.com.br/x/imoveis/casa-3', price: 'A combinar', location: 'Franca, Centro' })}
    ${olxCard({ href: '', price: 'R$ 1', location: 'Franca, Centro' })}
    ${olxCard({ href: 'https://sp.olx.com.br/x/imoveis/sem-bairro-77', price: 'R$ 900', location: 'Franca', details: '' })}
  </body>`;

  it('extrai detalhes por aria-label, selo do anunciante e total de resultados', async () => {
    const { imoveis, qtd } = await olxAdapter(html);
    expect(qtd).toBe(4809);
    expect(imoveis).toHaveLength(2);
    expect(imoveis[0]).toMatchObject({
      valor: 2100000, area: 220, quartos: 3, banheiros: 5, vagas: 3, endereco: 'JARDIM VENEZA',
      codigo: '1548616786', tipoImovel: 'casa',
      imagens: ['https://img.olx.com.br/thumbs700x500/1.webp'],
    });
    expect(imoveis[0].descricao).toContain('Direto com o proprietário');
  });

  it('anuncio sem bairro nem detalhes nao quebra', async () => {
    const { imoveis } = await olxAdapter(html);
    expect(imoveis[1]).toMatchObject({ endereco: '', area: 0, precoPorMetro: 0, codigo: '77' });
  });

  it('sem total de resultados devolve qtd 0', async () => {
    expect((await olxAdapter('<html></html>')).qtd).toBe(0);
  });

  it('venda e aluguel com paginacao ?o=N e teto de paginas', () => {
    expect(olx.map(s => s.tipo)).toEqual(['venda', 'aluguel']);
    expect(olx[0].getPaginateParams(1).url).toContain('/imoveis/venda/estado-sp/regiao-de-ribeirao-preto/franca');
    expect(olx[1].getPaginateParams(3).url).toBe('https://www.olx.com.br/imoveis/aluguel/estado-sp/regiao-de-ribeirao-preto/franca?o=3');
    expect(olx[0].maxPages).toBeLessThanOrEqual(20);
  });

  it('o adapter do site grava o nome do site no anuncio', async () => {
    const { imoveis } = await olx[0].adapter(html);
    expect(imoveis[0].site).toBe('olx.com.br - Comprar');
  });
});

describe('imobiliariaestillo', () => {
  it('pagina pelo path e continua buscando enquanto a pagina vier cheia', async () => {
    expect(estillo.getPaginateParams(1).url).toBe('https://www.imobiliariaestillo.com.br/imoveis/a-venda');
    expect(estillo.getPaginateParams(2).url).toBe('https://www.imobiliariaestillo.com.br/imoveis/a-venda/pagina-2/');
    const one = '<div class="resultado"><div class="foto"><a href="/i/1"><img src="x.jpg" title="Casa"></a></div><div class="valor"><h5>R$ 100.000,00</h5></div></div>';
    expect((await estillo.adapter(one)).qtd).toBe(1);
    expect((await estillo.adapter(one.repeat(24))).qtd).toBe(240);
  });
});

describe('registro', () => {
  it('registra cada novo provider exatamente uma vez (o nome e a chave de cache)', () => {
    const names = sites.map(s => s.name);
    ['imobiliariaestillo.com.br', 'imobiliariafabioliporoni.com.br', 'casamineira.com.br - Comprar', 'casamineira.com.br - Alugar',
      'zapimoveis.com.br - Comprar', 'zapimoveis.com.br - Alugar', 'olx.com.br - Comprar', 'olx.com.br - Alugar']
      .forEach(name => expect(names.filter(n => n === name)).toHaveLength(1));
  });

  it('todo site habilitado declara a finalidade ou e do tipo ambos', () => {
    sites.filter(s => s.enabled && s.tipo).forEach(s => expect(['venda', 'aluguel', 'ambos']).toContain(s.tipo));
  });
});
