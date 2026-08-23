import anzimoveis, { adapter } from '../src/sites/anzimoveis';

describe('anzimoveis', () => {
  it('should adapt HTML correctly', async () => {
    const html = `
    <div class="property-card">
      <a href="/imovel/123">
         <h2 class="title">Casa Nova</h2>
         <div class="location">Centro, Franca</div>
         <div class="price">R$ 500.000,00</div>
         <div class="features">
            <span>3 quartos</span>
            <span>2 suítes</span>
            <span>2 vagas</span>
            <span>120m²</span>
         </div>
         <img src="/img.jpg" />
      </a>
    </div>
    <div class="total-properties">15 imóveis encontrados</div>
    `;

    const { imoveis, qtd } = await adapter(html);
    expect(qtd).toBe(15);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Nova');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].area).toBe(120);
    expect(imoveis[0].endereco).toBe('CENTRO');
    expect(anzimoveis.getPaginateParams(2)).toEqual({ url: 'https://anzimoveis.com.br/busca?finalidade=venda&pagina=2' });
  });

  it('should handle alternative html layout', async () => {
     const html = `
     <div class="imovel-box">
       <a href="http://anzimoveis.com.br/123">Link</a>
       <h3 class="title">Teste</h3>
       <div class="address">bairro</div>
       <div class="valor">R$ 1.000.000,00</div>
     </div>
     `;
     const { imoveis } = await adapter(html);
     expect(imoveis[0].valor).toBe(1000000);
  });

  it('should ignore item without title', async () => {
    const html = '<div class="property-card"><a href="/imovel/123"></a></div>';
    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(0);
  });
});
