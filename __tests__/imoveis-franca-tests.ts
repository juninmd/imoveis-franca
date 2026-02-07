import { adapter } from '../src/sites/imoveis-franca';

describe('Imoveis Franca Adapter', () => {
  it('should parse HTML correctly', async () => {
    const html = `
      <div id="result">Encontrados 5 imóveis</div>
      <div class="card-resultado">
        <div class="titulo-resultado-busca">Casa Padrão</div>
        <div class="endereco-resultado-busca">Centro, Franca</div>
        <div class="valores-resultado-busca"><h3>R$ 450.000,00</h3></div>
        <div class="comodidades-resultado-busca">
          <div>200 m²</div>
          <div>3 Quartos</div>
          <div>2 Banheiros</div>
          <div>1 Vagas</div>
        </div>
        <div class="carousel-inner">
          <div class="item"><img src="img1.jpg"></div>
        </div>
        <a class="link-resultado" href="/imovel/123">Link</a>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(5);
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('CASA');
    expect(imovel.valor).toBe(450000);
    expect(imovel.area).toBe(200);
    expect(imovel.quartos).toBe(3);
    expect(imovel.vagas).toBe(1);
    expect(imovel.endereco).toBe('CENTRO');
  });
});
