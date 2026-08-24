import { adapter } from '../src/sites/sueliandradelopes';

describe('sueliandradelopes adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/4081761/cobertura-venda-franca-sp-residencial-amazonas">
        <div class="row">
          <a href="/imovel/4081761/cobertura-venda-franca-sp-residencial-amazonas" title="Cobertura para Venda" class="col imovelcard__img">
            <img src="https://imgs1.cdn-imobibrasil.com.br/imagens/imoveis/thumb15-202512121056471366.jpg" alt="">
          </a>
          <div class="col imovelcard__infocontainer">
            <div class="row imovelcard__infotopcontainer">
              <div class="col imovelcard__info">
                <h2 class="imovelcard__info__tag">Venda</h2>
                <h2 class="imovelcard__info__local">Centro, Franca / SP</h2>
                <p class="imovelcard__info__ref"><strong>Ref: 01</strong> - Casa</p>
                <div class="imovelcard__info__feature"><i class="fa fa-bed"></i><p><b>3</b> <span>Dormitórios</span></p></div>
                <div class="imovelcard__info__feature"><i class="fa fa-shower"></i><p><b>2</b> <span>Banheiros</span></p></div>
                <div class="imovelcard__info__feature"><i class="fa fa-car"></i><p><b>2</b> <span>Vagas</span></p></div>
                <div class="imovelcard__info__feature"><i class="fa fa-arrows-h"></i><p><b>150,00 m²</b> Útil</p></div>
              </div>
              <div class="col imovelcard__valor">
                <p class="imovelcard__valor__valor"><span>R$</span> 500.000</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="imovelcard" data-link="/imovel/456/apartamento-venda-franca-sp-cidade-nova">
        <div class="row">
          <a href="/imovel/456/apartamento-venda-franca-sp-cidade-nova" title="Apartamento para Venda" class="col imovelcard__img">
            <img data-src="/img/test2.jpg" src="data:image/png;base64,123" alt="">
          </a>
          <div class="col imovelcard__infocontainer">
            <div class="row imovelcard__infotopcontainer">
              <div class="col imovelcard__info">
                <h2 class="imovelcard__info__local">Cidade Nova, Franca / SP</h2>
                <p class="imovelcard__info__ref"><strong>Ref: 02</strong> - Apartamento</p>
                <div class="imovelcard__info__feature"><i class="fa fa-bed"></i><p><b>2</b> <span>Dormitórios</span></p></div>
                <div class="imovelcard__info__feature"><i class="fa fa-shower"></i><p><b>1</b> <span>Banheiro</span></p></div>
                <div class="imovelcard__info__feature"><i class="fa fa-car"></i><p><b>1</b> <span>Vaga</span></p></div>
                <div class="imovelcard__info__feature"><i class="fa fa-arrows-h"></i><p><b>80,00 m²</b> Útil</p></div>
              </div>
              <div class="col imovelcard__valor">
                <p class="imovelcard__valor__valor"><span>R$</span> 300.000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const { imoveis } = await adapter(html);

    expect(imoveis).toHaveLength(2);

    expect(imoveis[0]).toMatchObject({
      titulo: 'Ref: 01 - Casa',
      endereco: 'CENTRO',
      valor: 500000,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      area: 150,
      areaTotal: 150,
      link: 'https://www.sueliandradelopes.com.br/imovel/4081761/cobertura-venda-franca-sp-residencial-amazonas',
      site: 'sueliandradelopes.com.br',
      imagens: ['https://imgs1.cdn-imobibrasil.com.br/imagens/imoveis/202512121056471366.jpg'],
    });

    expect(imoveis[1]).toMatchObject({
      titulo: 'Ref: 02 - Apartamento',
      endereco: 'CIDADE NOVA',
      valor: 300000,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      area: 80,
      areaTotal: 80,
      link: 'https://www.sueliandradelopes.com.br/imovel/456/apartamento-venda-franca-sp-cidade-nova',
      site: 'sueliandradelopes.com.br',
      imagens: ['https://www.sueliandradelopes.com.br/img/test2.jpg'],
    });
  });

  it('should handle edge cases', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda">
        <a class="imovelcard__img" href="/imovel/123/casa-venda"></a>
        <p class="imovelcard__info__ref"><strong>Ref: 001</strong> - Casa</p>
        <h2 class="imovelcard__info__local">Centro, Franca / SP</h2>
        <p class="imovelcard__valor__valor"><span>R$</span> 500.000</p>
        <img src="https://example.com/img1.jpg">
        <img data-src="/img2.jpg">
        <img src="logo.png">
        <img data-src="">
        <div class="imovelcard__info__feature"><p><b>3</b> Dormitórios</p></div>
        <div class="imovelcard__info__feature"><p><b>2</b> Banheiros</p></div>
        <div class="imovelcard__info__feature"><p><b>2</b> Vagas</p></div>
        <div class="imovelcard__info__feature"><p><b>150,00 m²</b> Útil</p></div>
      </div>
      <div class="imovelcard" data-link="/imovel/124/casa-venda">
        <a class="imovelcard__img" href="/imovel/124/casa-venda"></a>
        <p class="imovelcard__info__ref"><strong>Ref: 002</strong> - Casa</p>
        <h2 class="imovelcard__info__local">Vila Nova, Franca / SP</h2>
        <p class="imovelcard__valor__valor"><span>R$</span> 0</p>
        <div class="imovelcard__info__feature"><p><b>3</b> Dormitórios</p></div>
      </div>
      <div class="imovelcard">
        <!-- Missing link -->
        <p class="imovelcard__info__ref"><strong>Ref: 003</strong> - Casa</p>
      </div>
      <div class="imovelcard" data-link="/imovel/125/casa-venda">
        <a class="imovelcard__img" href="/imovel/125/casa-venda"></a>
        <p class="imovelcard__info__ref"><strong>Ref: 004</strong> - Casa</p>
        <h2 class="imovelcard__info__local">Vila Nova, Franca / SP</h2>
        <p class="imovelcard__valor__valor"><span>R$</span> 400.000</p>
        <div class="imovelcard__info__feature"><p>Quarto</p></div>
        <div class="imovelcard__info__feature"><p><b>1</b> Banheiro</p></div>
        <div class="imovelcard__info__feature"><p>Vaga</p></div>
        <div class="imovelcard__info__feature"><p>Útil</p></div>
      </div>
    `;

    const result = await adapter(html);

    expect(result.qtd).toBe(2);
    expect(result.imoveis[0].titulo).toBe('Ref: 001 - Casa');
    expect(result.imoveis[0].endereco).toBe('CENTRO');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].area).toBe(150);
    expect(result.imoveis[0].link).toBe('https://www.sueliandradelopes.com.br/imovel/123/casa-venda');
    expect(result.imoveis[0].imagens).toEqual([
      'https://example.com/img1.jpg',
      'https://www.sueliandradelopes.com.br/img2.jpg'
    ]);

    expect(result.imoveis[1].titulo).toBe('Ref: 004 - Casa');
    expect(result.imoveis[1].area).toBe(0);
    expect(result.imoveis[1].quartos).toBe(0);
    expect(result.imoveis[1].banheiros).toBe(1);
    expect(result.imoveis[1].vagas).toBe(0);
  });
});
