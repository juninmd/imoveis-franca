import { parseProjetive, buildProjetiveSite } from '../src/sites/platforms/projetive';
import jardini from '../src/sites/jardiniimoveis';
import espaco from '../src/sites/espaconobreimoveis';
import { sites } from '../src/sites';

const BASE = 'https://exemplo.com.br';
const item = (over: Record<string, unknown> = {}) => ({
  slug: 'casa-a-venda-no-centro-123', purpose: 'sale', is_active: true, reference_code: 'CA123',
  machine: { price: 730000, image_url: 'https://cdn.example.com/main.jpg', description: 'Sobrado a venda' },
  type: { name: 'Casa' }, neighborhood: 'Vila Scarabucci', city: 'Franca', bedrooms: 3, bathrooms: 2, parking_spots: 1,
  built_area: 120, land_area: 250, short_description: 'Casa ampla',
  images: [{ kind: 'photo', medium_url: 'https://cdn.example.com/1.jpg' }, { kind: 'plan', url: 'https://cdn.example.com/planta.jpg' }, { url: 'https://cdn.example.com/2.jpg' }],
  ...over,
});

describe('plataforma Projetive', () => {
  it('le preco, metricas, codigo, fotos (sem planta) e total', () => {
    const { imoveis, qtd } = parseProjetive({ total: 2260, items: [item()] }, 'exemplo.com.br', BASE);
    expect(qtd).toBe(2260);
    expect(imoveis[0]).toMatchObject({
      titulo: 'CASA', valor: 730000, quartos: 3, banheiros: 2, vagas: 1, area: 120, areaTotal: 250, codigo: 'CA123',
      endereco: 'VILA SCARABUCCI', descricao: 'Casa ampla', link: `${BASE}/imoveis/casa-a-venda-no-centro-123`,
      imagens: ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'], precoPorMetro: 730000 / 250,
    });
  });

  it('descarta aluguel, inativo, sem preco e sem slug; cai para a foto da vitrine e para valores vazios', () => {
    const { imoveis, qtd } = parseProjetive({ items: [
      item({ purpose: 'rent' }), item({ is_active: false }), item({ machine: { price: 0 } }), item({ slug: '' }),
      item({ images: [], type: undefined, property_type: undefined, reference_code: undefined, short_description: undefined, machine: { price: 100000, image_url: 'https://cdn.example.com/vitrine.jpg' }, built_area: 0, land_area: 0, total_area: 0 }),
    ] }, 'exemplo.com.br', BASE);
    expect(qtd).toBe(0);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0]).toMatchObject({ titulo: 'IMÓVEL', imagens: ['https://cdn.example.com/vitrine.jpg'], precoPorMetro: 0, codigo: undefined, descricao: '' });
    expect(parseProjetive(null, 'x', BASE).imoveis).toEqual([]);
  });

  it('config: tenant exige x-tenant-host (Jardini), Espaco Nobre nao; pagina so troca "page"', () => {
    expect(jardini.axiosConfig?.headers).toMatchObject({ 'x-tenant-host': 'jardini-site.projetive.com.br' });
    expect(espaco.axiosConfig).toBeUndefined();
    expect(buildProjetiveSite({ base: BASE, name: 'x' }).url).toBe(`${BASE}/api/public/properties`);
    // Duas ordens varridas (a paginacao por offset repete anuncios); a query so vai na URL.
    expect(jardini.params).toEqual([{ sort: 'recent' }, { sort: 'featured' }]);
    expect(jardini.getPaginateParams(3, { sort: 'featured' })).toEqual({ url: 'https://jardiniimoveis.com.br/api/public/properties?purpose=sale&city=Franca&sort=featured&page_size=48&page=3' });
    expect(jardini.getPaginateParams(1).url).toContain('sort=recent');
    [jardini, espaco].forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });
});
