import axios from 'axios';
import s2i, { adapter as s2iAdapter } from '../src/sites/s2iinteligenciaimobiliaria';
import belavista, { adapter as belavistaAdapter } from '../src/sites/belavistarp';
import { parseLlmsCatalog } from '../src/sites/platforms/llmstxt';
import { sites } from '../src/sites';

jest.mock('axios');
const mockedGet = axios.get as jest.Mock;

const tecimobItem = (over: Record<string, unknown> = {}) => ({
  id: 'uuid-1',
  price: 'R$420.000',
  reference: '487',
  title_formatted: 'Apartamento Duplex à Venda, Jardim Consolação – Franca/SP',
  description: '<p>Espaço <b>amplo</b></p>',
  url: 'apartamento-a-venda-no-bairro-jardim-consolacao-em-franca-sp/487',
  address: { formatted: 'Jardim Consolação - Franca/SP' },
  areas: { built_area: { value: '100' }, total_area: { value: '120' } },
  rooms: { bedroom: { value: 2 }, bathroom: { value: 1 }, garage: { value: 2 } },
  ...over,
});

describe('s2iinteligenciaimobiliaria (API Tecimob)', () => {
  beforeEach(() => mockedGet.mockReset());

  it('le detalhes e busca as fotos na galeria do detalhe do imovel', async () => {
    mockedGet.mockResolvedValue({ data: { data: { images_extra: [{ file_url: { large: 'https://img/1.jpg' } }, { file_url: {} }] } } });
    const { imoveis, qtd } = await s2iAdapter({ data: [tecimobItem()] });
    expect(qtd).toBe(1);
    expect(imoveis[0]).toMatchObject({
      valor: 420000, area: 100, areaTotal: 120, quartos: 2, banheiros: 1, vagas: 2, codigo: '487', tipoImovel: 'apartamento',
      site: 's2iinteligenciaimobiliaria.com.br', imagens: ['https://img/1.jpg'], descricao: 'Espaço amplo',
      link: 'https://s2iinteligenciaimobiliaria.com.br/imovel/apartamento-a-venda-no-bairro-jardim-consolacao-em-franca-sp/487',
    });
    expect(mockedGet.mock.calls[0][1].headers['x-domain']).toBe('s2iinteligenciaimobiliaria.com.br');
  });

  it('mantem o anuncio mesmo quando o detalhe das fotos falha', async () => {
    mockedGet.mockRejectedValue(new Error('boom'));
    const { imoveis } = await s2iAdapter(JSON.stringify({ data: [tecimobItem()] }));
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0].imagens).toEqual([]);
  });

  it('descarta outras cidades, sem url e sem preco; aceita corpo vazio', async () => {
    mockedGet.mockResolvedValue({ data: { data: {} } });
    const { imoveis } = await s2iAdapter({ data: [
      tecimobItem({ address: { formatted: 'Centro - Rifaina/SP' } }),
      tecimobItem({ url: undefined }),
      tecimobItem({ price: 'Sob consulta' }),
    ] });
    expect(imoveis).toHaveLength(0);
    expect((await s2iAdapter({})).imoveis).toHaveLength(0);
  });

  it('sem area construida usa a total; sem comodos zera', async () => {
    mockedGet.mockResolvedValue({ data: {} });
    const { imoveis } = await s2iAdapter({ data: [tecimobItem({ areas: { total_area: { value: '300' } }, rooms: undefined })] });
    expect(imoveis[0]).toMatchObject({ area: 300, areaTotal: 300, precoPorMetro: 1400, quartos: 0, banheiros: 0, vagas: 0, imagens: [] });
  });

  it('config: API publica identificada pelo cabecalho x-domain, so venda', () => {
    expect(s2i).toMatchObject({ tipo: 'venda', driver: 'axios_rest', method: 'GET', axiosConfig: { headers: { 'x-domain': 's2iinteligenciaimobiliaria.com.br' } } });
    expect(s2i.getPaginateParams(1)).toEqual({ url: 'https://api-sites.tecimob.com.br/api/properties' });
  });
});

const catalog = `# Imobiliária Exemplo

### Casa - REF1
- Referência: REF1
- Tipo: Casa
- Finalidade: Venda
- Cidade: Franca
- Bairro: Centro
- Valor: R$ 350.000,00
- Dormitórios: 3
- Área construída: 120 m²
- ![Imagem 1](http://x.com.br/1.jpg)
[Ver imóvel completo](http://x.com.br/imovel/1)

### Casa - REF2
- Referência: REF2
- Tipo: Casa
- Finalidade: Venda
- Cidade: Ribeirão Preto
- Bairro: Centro
- Valor: R$ 500.000,00
[Ver imóvel completo](http://x.com.br/imovel/2)

### Terreno - REF3
- Referência: REF3
- Tipo: Terreno
- Finalidade: Locação
- Bairro: Sem Cidade
- Valor: R$ 900,00
[Ver imóvel completo](http://x.com.br/imovel/3)
`;

describe('belavistarp (catalogo /llms.txt multi-cidade)', () => {
  it('mantem so Franca e aceita bloco sem Cidade; http vira https', async () => {
    const { imoveis } = await belavistaAdapter(catalog);
    expect(imoveis.map(i => i.codigo)).toEqual(['REF1', 'REF3']);
    expect(imoveis[0]).toMatchObject({ link: 'https://x.com.br/imovel/1', quartos: 3, area: 120, imagens: ['http://x.com.br/1.jpg'], site: 'belavistarp.com.br', tipo: 'venda' });
    expect(imoveis[1].tipo).toBe('aluguel');
  });

  it('config e parser compartilhado', () => {
    expect(belavista).toMatchObject({ tipo: 'ambos', driver: 'axios', url: 'https://www.belavistarp.com.br/llms.txt' });
    expect(belavista.getPaginateParams(1)).toEqual({ url: 'https://www.belavistarp.com.br/llms.txt' });
    expect(parseLlmsCatalog('', 'x')).toMatchObject({ imoveis: [], qtd: 0 });
  });
});

describe('registro (4)', () => {
  it('registra os novos providers com nomes unicos', () => {
    const names = sites.map(s => s.name);
    ['belavistarp.com.br', 's2iinteligenciaimobiliaria.com.br'].forEach(name => expect(names.filter(n => n === name)).toHaveLength(1));
  });
});
