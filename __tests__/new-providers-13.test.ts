import isper, { parseIsper, IsperItem } from '../src/sites/ispernassifimobiliaria';
import { sites } from '../src/sites';

const item = (over: Partial<IsperItem> = {}): IsperItem => ({
  IDImovel: 317, Codigo: 'PT0005', Cidade: 'Franca', Bairro: 'Vila Aparecida', TipoImovel: 'Ponto Comercial',
  DisponibilidadeVenda: 'disponível', DisponibilidadeAluguel: 'disponível', ValorVenda: '3500000', ValorLocacao: '10000',
  NumeroDormitorios: '0', NumeroBanheiros: '1', NumeroVagasGaragem: '2', AreaTotal: '657.9', AreaPrivativa: '113.3', AreaUtil: '0',
  TituloSite: 'Imóvel comercial na Av. Brasil', DescricaoSite: 'Excelente imóvel', ImagemPrincipal: 'assets/images/x.webp', ...over,
});
const body = (items: IsperItem[], total = 235) => JSON.stringify([items, { Paginas: '26' }, { Total: total }]);

describe('ispernassifimobiliaria (POST buscarimoveis)', () => {
  it('venda le valor de venda, area privativa, comodos, foto no host /adm e total do catalogo', async () => {
    const { imoveis, qtd } = await parseIsper(body([item()]), 'i - Comprar', 'venda');
    expect(qtd).toBe(235);
    expect(imoveis[0]).toMatchObject({
      valor: 3500000, area: 113.3, areaTotal: 657.9, quartos: 0, banheiros: 1, vagas: 2, codigo: 'PT0005', tipoImovel: 'comercial',
      titulo: 'Imóvel comercial na Av. Brasil', endereco: 'VILA APARECIDA', link: 'https://www.ispernassifimobiliaria.com.br/imovel.php?id=317',
      imagens: ['https://ispernassifimobiliaria.com.br/adm/assets/images/x.webp'], precoPorMetro: 3500000 / 113.3, descricao: 'Excelente imóvel',
    });
  });

  it('aluguel usa o valor de locacao do mesmo item', async () => {
    const { imoveis } = await parseIsper(JSON.parse(body([item()])), 'i - Alugar', 'aluguel');
    expect(imoveis[0].valor).toBe(10000);
  });

  it('decodifica descricao em base64 (HTML) e cai para tipo-bairro sem titulo', async () => {
    const b64 = Buffer.from('<p>Im&oacute;vel com 657 m&sup2;</p>').toString('base64');
    const { imoveis } = await parseIsper(body([item({ DescricaoSite: b64, TituloSite: null })]), 'i', 'venda');
    expect(imoveis[0].descricao).toBe('Imóvel com 657 m²');
    expect(imoveis[0].titulo).toBe('Ponto Comercial - Vila Aparecida');
  });

  it('descarta indisponiveis da finalidade, sem valor, outras cidades e sem id; aceita caixa alta', async () => {
    const { imoveis } = await parseIsper(body([
      item({ DisponibilidadeVenda: 'indisponível' }),
      item({ ValorVenda: '0' }),
      item({ Cidade: 'Ribeirão Preto' }),
      item({ IDImovel: undefined }),
      item({ Cidade: 'FRANCA', IDImovel: 9, Codigo: undefined, AreaPrivativa: 0, AreaUtil: '80', ImagemPrincipal: null, Bairro: '', TituloSite: '' }),
    ]), 'i', 'venda');
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ codigo: '9', area: 80, imagens: [], titulo: 'Ponto Comercial' });
  });

  it('corpo vazio ou sem total nao quebra e cai para a quantidade lida', async () => {
    expect((await parseIsper('[[],{},{}]', 'i', 'venda')).qtd).toBe(0);
    expect((await parseIsper({}, 'i', 'venda')).imoveis).toEqual([]);
    expect((await parseIsper([[item()]], 'i', 'venda')).qtd).toBe(1);
  });

  it('config: POST urlencoded com offset em itens (9 por pagina) e registro unico por finalidade', async () => {
    const [venda, aluguel] = isper;
    expect([venda.name, aluguel.name]).toEqual(['ispernassifimobiliaria.com.br - Comprar', 'ispernassifimobiliaria.com.br - Alugar']);
    expect(venda).toMatchObject({ driver: 'axios_rest', method: 'POST', tipo: 'venda', itemsPerPage: 9 });
    expect(aluguel.getPaginateParams(1).payload).toEqual({ offset: 0 });
    expect(aluguel.getPaginateParams(3).payload).toEqual({ offset: 18 });
    const names = sites.map(s => s.name);
    isper.forEach(s => expect(names.filter(n => n === s.name)).toHaveLength(1));
    const out = await aluguel.adapter(body([item()]) as never) as unknown as { imoveis: Array<{ site: string }> };
    expect(out.imoveis[0].site).toBe('ispernassifimobiliaria.com.br - Alugar');
  });
});
