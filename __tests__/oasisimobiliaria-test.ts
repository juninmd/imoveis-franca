import { adapter } from '../src/sites/oasisimobiliaria';

describe('oasisimobiliaria adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <div class="wrap">
        <div class="resultados-toolbar">
          <div class="resultados-count">Exibindo <strong>1–9</strong> de <strong>150</strong> imóveis</div>
        </div>
        <a href="https://oasisimobiliaria.com.br/imoveis/rancho-regiao-cassia-mg/" class="card bracket" style="display:block;color:inherit;">
          <div class="photo">
            <img class="photo-img" src="https://oasisimobiliaria.com.br/wp-content/uploads/2023/05/Piscina-768x576.jpg" alt="Rancho região Cássia-MG">
            <span class="tag venda">VENDA</span>
            <span class="card-code mono">CÓD. 1353</span>
          </div>
          <div class="body">
            <h3>Rancho região Cássia-MG</h3>
            <div class="loc">Área Rural, Franca — SP</div>
            <div class="specs">
              <span>04 dormitórios</span>
              <span>04 banheiros</span>
              <span>00 vagas</span>
              <span>700 m²</span>
            </div>
            <div class="price">R$ 6.000.000</div>
          </div>
        </a>
        <a href="https://oasisimobiliaria.com.br/imoveis/apto-aluguel-centro/" class="card bracket">
          <div class="photo">
            <img class="photo-img" src="https://oasisimobiliaria.com.br/wp-content/uploads/2024/01/apto.jpg" alt="Apto Centro">
            <span class="tag aluguel">ALUGUEL</span>
            <span class="card-code mono">CÓD. 9999</span>
          </div>
          <div class="body">
            <h3>Apto Centro</h3>
            <div class="loc">Centro, Franca — SP</div>
            <div class="price">R$ 2.000 /mês</div>
          </div>
        </a>
        <a class="card bracket">
          <div class="body"><h3>Sem link</h3></div>
        </a>
        <a href="https://oasisimobiliaria.com.br/imoveis/invalido/" class="card bracket">
          <!-- Sem titulo -->
        </a>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(150);
    expect(result.imoveis.length).toBe(1);

    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('Rancho região Cássia-MG');
    expect(imovel.endereco).toBe('AREA RURAL, FRANCA — SP');
    expect(imovel.valor).toBe(6000000);
    expect(imovel.area).toBe(700);
    expect(imovel.quartos).toBe(4);
    expect(imovel.banheiros).toBe(4);
    expect(imovel.vagas).toBe(0);
    expect(imovel.link).toBe('https://oasisimobiliaria.com.br/imoveis/rancho-regiao-cassia-mg/');
    expect(imovel.imagens).toEqual(['https://oasisimobiliaria.com.br/wp-content/uploads/2023/05/Piscina-768x576.jpg']);
    expect(imovel.site).toBe('oasisimobiliaria.com.br');
  });

  it('should handle zero qtd and zero items when there is no listing markup', async () => {
    const html = '<div class="resultados-count">Nenhum resultado</div>';
    const result = await adapter(html);
    expect(result.qtd).toBe(0);
    expect(result.imoveis.length).toBe(0);
  });

  it('should handle alternative image sources', async () => {
     const html = `
      <div class="resultados-count">Exibindo <strong>1–9</strong> de <strong>150</strong> imóveis</div>
      <a href="https://oasisimobiliaria.com.br/imoveis/teste2/" class="card bracket">
        <div class="photo">
          <img class="photo-img" src="data:image/svg" data-lazy-src="/img2.jpg" alt="Teste 2">
        </div>
        <div class="body">
          <h3>Teste de imovel 2</h3>
          <div class="loc">Centro, Franca — SP</div>
          <div class="price">R$ 1.500.000</div>
        </div>
      </a>
    `;
    const result = await adapter(html);
    expect(result.imoveis[0].imagens).toEqual(['https://oasisimobiliaria.com.br/img2.jpg']);
  });
});
