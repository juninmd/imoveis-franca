import { adapter } from '../src/sites/wi7imobiliaria';

describe('WI7 Imobiliária Adapter', () => {
  it('should parse HTML correctly', async () => {
    const html = `
      <div class="recent-properties-box">
        <h1 class="title"><a href="/imovel/123">Venda Casa</a></h1>
        <div class="price">R$ 400.000,00</div>
        <div class="location"><a href="/imovel/123">Jardim Consolação</a></div>
        <img src="img.jpg" alt="casa">
        <ul class="facilities-list">
          <li>3 Quartos</li>
          <li>2 Banheiros</li>
          <li>2 Garagem</li>
        </ul>
      </div>
      <div class="recent-properties-box">
        <img alt="Sem Titulo e Venda">
        <div class="price">Consulte</div>
        <div class="location"><a href="/imovel/124">Centro</a></div>
        <ul class="facilities-list"></ul>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(1); // the second one doesn't have positive valor and link
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Venda Casa');
    expect(imovel.valor).toBe(400000);
    expect(imovel.quartos).toBe(3);
    expect(imovel.banheiros).toBe(2);
    expect(imovel.vagas).toBe(2);
    expect(imovel.endereco).toBe('JARDIM CONSOLACAO');
    expect(imovel.link).toBe('https://www.wi7imobiliaria.com.br/imovel/123');
  });
});
