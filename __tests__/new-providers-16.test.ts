import axios from 'axios';
import gonDon from '../src/sites/goncalvesdonzelli';
import patrimonios from '../src/sites/patrimoniosimob';
import camargo from '../src/sites/camargoimoveisfranca';
import jl from '../src/sites/jlimoveisfranca';
import { buildLlmsSite } from '../src/sites/platforms/llmstxt';
import { sites } from '../src/sites';

jest.mock('axios');
const mockedGet = axios.get as jest.Mock;

const item = (over: Record<string, unknown> = {}) => ({
  id: 'u1', price: 'R$ 6.000', reference: '1815', transaction: 'ALUGUEL', title_formatted: 'Casa para Alugar - Centro',
  url: 'casa-para-alugar/1815', address: { formatted: 'Centro - Franca/SP' }, ...over,
});

describe('platforms/tecimob (venda e aluguel)', () => {
  beforeEach(() => mockedGet.mockResolvedValue({ data: { data: { images_extra: [{ file_url: { large: 'https://img/1.jpg' } }] } } }));

  it('cada finalidade so recebe os anuncios da sua transacao; sem transacao vale para ambas', async () => {
    const payload = { data: [item(), item({ transaction: 'VENDA', reference: '2', url: 'v/2' }), item({ transaction: undefined, reference: '3', url: 'x/3' })] };
    const [venda, aluguel] = gonDon;
    expect((await venda.adapter(payload as never) as unknown as { imoveis: Array<{ codigo: string }> }).imoveis.map(i => i.codigo)).toEqual(['2', '3']);
    const out = await aluguel.adapter(payload as never) as unknown as { imoveis: Array<{ codigo: string; site: string; link: string; imagens: string[] }> };
    expect(out.imoveis.map(i => i.codigo)).toEqual(['1815', '3']);
    expect(out.imoveis[0]).toMatchObject({ site: 'goncalvesdonzelli.com.br - Alugar', link: 'https://goncalvesdonzelli.com.br/imovel/casa-para-alugar/1815', imagens: ['https://img/1.jpg'] });
    expect(mockedGet.mock.calls[0][1].headers['x-domain']).toBe('goncalvesdonzelli.com.br');
  });

  it('config: x-domain por site, nomes unicos e so venda quando pedido', () => {
    expect(gonDon.map(s => s.name)).toEqual(['goncalvesdonzelli.com.br - Comprar', 'goncalvesdonzelli.com.br - Alugar']);
    expect(patrimonios.map(s => s.name)).toEqual(['patrimoniosimob.com.br - Comprar']);
    expect(patrimonios[0]).toMatchObject({ tipo: 'venda', driver: 'axios_rest', axiosConfig: { headers: { 'x-domain': 'patrimoniosimob.com.br' } } });
    expect(patrimonios[0].getPaginateParams(1)).toEqual({ url: 'https://api-sites.tecimob.com.br/api/properties' });
    [...gonDon, ...patrimonios].forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});

describe('buildLlmsSite (ImobiBrasil)', () => {
  const catalog = `# X

### Casa - R1
- Referência: R1
- Tipo: Casa
- Finalidade: Venda
- Cidade: Franca
- Valor: R$ 100.000,00
[Ver imóvel completo](http://www.x.com.br/imovel/1)
`;

  it('https por padrao promove o link; http mantem o link e a URL do catalogo', async () => {
    const secure = buildLlmsSite('x.com.br', 'x.com.br');
    const plain = buildLlmsSite('x.com.br', 'x.com.br', false);
    expect(secure.url).toBe('https://www.x.com.br/llms.txt');
    expect(plain.url).toBe('http://www.x.com.br/llms.txt');
    expect(secure.getPaginateParams(1)).toEqual({ url: 'https://www.x.com.br/llms.txt' });
    expect((await secure.adapter(catalog as never) as unknown as { imoveis: Array<{ link: string }> }).imoveis[0].link).toBe('https://www.x.com.br/imovel/1');
    expect((await plain.adapter(catalog as never) as unknown as { imoveis: Array<{ link: string }> }).imoveis[0].link).toBe('http://www.x.com.br/imovel/1');
  });

  it('Camargo e JL estao registrados uma vez', () => {
    [camargo, jl].forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
    expect([camargo.url, jl.url]).toEqual(['https://www.camargoimoveisfranca.com.br/llms.txt', 'https://www.jlimoveisfranca.com.br/llms.txt']);
  });
});
