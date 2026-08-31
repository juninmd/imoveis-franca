import andrecaetano, { adapter } from '../src/sites/andrecaetano';

jest.mock('../src/utils', () => ({
  ...jest.requireActual('../src/utils'),
  normalizeNeighborhoodName: jest.fn((name) => name),
}));

describe('andrecaetano adapter', () => {
  it('should extract properties correctly', async () => {
    const html = `
      <div class="pagesNav">Resultado(s) 1 - 30 de 50 resultados</div>
      <dl class="gridTypeList">
        <dd class="foto-lista">
          <a href="/imovel/1">
            <img class="lazyload" data-src="/img1.jpg" />
          </a>
        </dd>
        <dd class="det-lista">
          <strong><a href="/imovel/1">Casa Centro</a></strong>
          <span class="loc notranslate"><b>Centro</b></span>
          <p class="descr">tima casa 250m2 de area</p>
        </dd>
        <dd class="pr-lista">
          <span class="valorImovel radius"><b>R$ 500.000,00</b></span>
        </dd>
        <div class="caracts-bottom">
          <span><b>3</b><small>Dormitórios</small></span>
          <span><b>0</b><small>Suítes</small></span>
          <span><b>2</b><small>Garagens</small></span>
        </div>
      </dl>
      <dl class="gridTypeList">
        <dd class="foto-lista">
          <a href="https://andrecaetano.com.br/imovel/2">
            <img src="https://andrecaetano.com.br/img2.jpg" />
          </a>
        </dd>
        <dd class="det-lista">
          <strong><a href="/imovel/2"></a></strong>
          <span class="loc notranslate"></span>
          <p class="descr"></p>
        </dd>
        <dd class="pr-lista">
          <span class="valorImovel radius"><b>R$ 300.000,00</b></span>
        </dd>
        <div class="caracts-bottom">
        </div>
      </dl>
      <dl class="gridTypeList">
      </dl>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(1000);
    expect(result.imoveis).toHaveLength(2);

    expect(result.imoveis[0]).toEqual(expect.objectContaining({
      titulo: 'Casa Centro',
      endereco: 'Centro',
      valor: 500000,
      area: 250,
      areaTotal: 250,
      quartos: 3,
      vagas: 2,
      link: 'https://andrecaetano.com.br/imovel/1',
      imagens: ['https://andrecaetano.com.br/img1.jpg'],
    }));

    expect(result.imoveis[1]).toEqual(expect.objectContaining({
      titulo: 'Imóvel em Franca',
      endereco: 'Franca',
      valor: 300000,
      area: 0,
      areaTotal: 0,
      quartos: 0,
      vagas: 0,
      link: 'https://andrecaetano.com.br/imovel/2',
      imagens: ['https://andrecaetano.com.br/img2.jpg'],
    }));
  });

  it('should have correct site configuration', () => {
    expect(andrecaetano.name).toBe('andrecaetano.com.br');
    expect(andrecaetano.url).toBe('https://andrecaetano.com.br/secao/venda');
    expect(andrecaetano.getPaginateParams(2)).toEqual({
      url: 'https://andrecaetano.com.br/secao/venda?pag=2',
    });
  });

  it('should handle zero results', async () => {
     const html = '<html></html>';
     const result = await adapter(html);
     expect(result.qtd).toBe(1000);
     expect(result.imoveis).toHaveLength(0);
  });
});
