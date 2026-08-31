import neoka, { adapter } from '../src/sites/neoka';

jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  normalizeNeighborhoodName: jest.fn((name) => name),
}));

describe('neoka adapter', () => {
  it('should extract properties correctly', async () => {
    const html = `
      <div class="recent-properties-box">
        <a href="/imovel/1"></a>
        <div class="tag-s">VENDE</div>
        <div class="title"><a href="/imovel/1">Casa Centro</a></div>
        <div class="location">Centro, Franca</div>
        <div class="price">R$ 500.000,00</div>
        <ul class="facilities-list">
          <li><i class="flaticon-bed"></i> 3</li>
          <li><i class="flaticon-holidays"></i> 2</li>
          <li><i class="flaticon-vehicle"></i> 2</li>
        </ul>
        <img class="img-responsive" src="/img1.jpg" />
      </div>
      <div class="recent-properties-box">
        <a href="https://www.neoka.com.br/imovel/2"></a>
        <div class="tag-f">VENDE</div>
        <div class="title"><a href="/imovel/2"></a></div>
        <div class="location"></div>
        <div class="price">R$ 300.000,00</div>
        <ul class="facilities-list">
        </ul>
        <img class="img-responsive" src="https://www.neoka.com.br/img2.jpg" />
      </div>
      <div class="recent-properties-box">
        <a href="/imovel/3"></a>
        <div class="tag-s">ALUGA</div>
      </div>
      <div class="recent-properties-box">
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(50);
    expect(result.imoveis).toHaveLength(2);

    expect(result.imoveis[0]).toEqual(expect.objectContaining({
      titulo: 'Casa Centro',
      endereco: 'Centro',
      valor: 500000,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      link: 'https://www.neoka.com.br/imovel/1',
      imagens: ['https://www.neoka.com.br/img1.jpg'],
    }));

    expect(result.imoveis[1]).toEqual(expect.objectContaining({
      titulo: 'Imóvel em Franca',
      endereco: 'Franca',
      valor: 300000,
      quartos: 0,
      banheiros: 0,
      vagas: 0,
      link: 'https://www.neoka.com.br/imovel/2',
      imagens: ['https://www.neoka.com.br/img2.jpg'],
    }));
  });

  it('should have correct site configuration', () => {
    expect(neoka.name).toBe('neoka.com.br');
    expect(neoka.url).toBe('https://www.neoka.com.br/imoveis');
    expect(neoka.getPaginateParams(2)).toEqual({
      url: 'https://www.neoka.com.br/imoveis?page=2',
    });
  });

  it('should handle zero results', async () => {
     const html = '<html></html>';
     const result = await adapter(html);
     expect(result.qtd).toBe(0);
     expect(result.imoveis).toHaveLength(0);
  });
});
