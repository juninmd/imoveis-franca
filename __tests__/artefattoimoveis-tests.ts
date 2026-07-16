import { adapter } from '../src/sites/artefattoimoveis';

describe('artefattoimoveis', () => {
  it('should adapt HTML correctly', async () => {
    const html = `
    <div class="imovel-box">
      <a href="/imovel/123">
         <h2 class="tit-list">Casa Nova</h2>
         <div class="fa-map-marker-alt"></div><p>Centro, Franca</p>
         <div class="price-area fw-700">R$ 500.000,00</div>
         <div class="infos">
           <div class="p-t-15">
              <span>3 quartos</span>
              <span>2 suítes</span>
              <span>2 vagas</span>
              <span>120m²</span>
           </div>
         </div>
         <figure>
            <img src="/img.jpg" />
         </figure>
      </a>
    </div>
    `;

    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(1);
    expect(imoveis[0].titulo).toBe('Casa Nova');
    expect(imoveis[0].valor).toBe(500000);
    expect(imoveis[0].quartos).toBe(3);
    expect(imoveis[0].banheiros).toBe(2);
    expect(imoveis[0].vagas).toBe(2);
    expect(imoveis[0].area).toBe(120);
    expect(imoveis[0].endereco).toBe('CENTRO');
  });

  it('should ignore item without title', async () => {
    const html = '<div class="imovel-box"><a href="/imovel/123"></a></div>';
    const { imoveis } = await adapter(html);
    expect(imoveis.length).toBe(0);
  });
});
