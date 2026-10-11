import site from '../src/sites/gnimoveis';

describe('gnimoveis coverage', () => {
  it('should handle edge cases', async () => {
    const mockHtml = `
      <body>
        <div></div>
        <div class="property">
        </div>
        <div class="property">
          <h2>Centro</h2>
        </div>
        <div class="property">
          <h2>- Centro</h2>
          <a href="http://link">L</a>
          <p>R$ 100.000</p>
        </div>
      </body>
    `;

    const result = await site.adapter(mockHtml);
    expect(result.imoveis.length).toBeGreaterThan(0);
    expect(result.qtd).toBe(0);
  });

  it('should format URL', () => {
      const p = site.getPaginateParams(2);
      expect(p.url).toContain('pagina=2');
  });
});
