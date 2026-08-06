import { adapter } from '../src/sites/sueliandradelopes';

describe('sueliandradelopes adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <div class="imovelcard" data-link="/imovel/123/casa-venda">
        <div class="imovelcard__info__tag">Venda</div>
        <div class="imovelcard__info__local">Centro, Franca / SP</div>
        <div class="imovelcard__info__ref">Ref: 01 - Casa</div>
        <div class="imovelcard__valor__valor">R$ 500.000</div>

        <div class="imovelcard__info__feature">
          <b>3</b> Dormitórios
        </div>
        <div class="imovelcard__info__feature">
          <b>2</b> Banheiros
        </div>
        <div class="imovelcard__info__feature">
          <b>2</b> Vagas
        </div>
        <div class="imovelcard__info__feature">
          <b>150</b> Área m²
        </div>

        <div class="imovelcard__img">
          <img src="/img/test.jpg" />
        </div>
      </div>

      <div class="imovelcard" data-link="/imovel/456/apartamento-venda">
        <div class="imovelcard__info__tag">Venda</div>
        <div class="imovelcard__info__local">Cidade Nova, Franca / SP</div>
        <div class="imovelcard__info__ref">Ref: 02 - Apartamento</div>
        <div class="imovelcard__valor__valor">R$ 300.000</div>

        <div class="imovelcard__info__feature">
          <b>2</b> Dormitórios
        </div>
        <div class="imovelcard__info__feature">
          <b>1</b> Banheiros
        </div>
        <div class="imovelcard__info__feature">
          <b>1</b> Vaga
        </div>
        <div class="imovelcard__info__feature">
          Área <b>80</b> m²
        </div>

        <div class="imovelcard__img">
          <img data-src="https://www.sueliandradelopes.com.br/img/test2.jpg" src="data:image/png;base64,123" />
        </div>
      </div>
    `;

    const { imoveis } = await adapter(html);

    expect(imoveis).toHaveLength(2);

    expect(imoveis[0]).toMatchObject({
      titulo: 'CASA',
      endereco: 'CENTRO',
      valor: 500000,
      quartos: 3,
      banheiros: 2,
      vagas: 2,
      area: 150,
      areaTotal: 150,
      link: 'https://www.sueliandradelopes.com.br/imovel/123/casa-venda',
      site: 'sueliandradelopes.com.br',
      imagens: ['https://www.sueliandradelopes.com.br/img/test.jpg'],
    });

    expect(imoveis[1]).toMatchObject({
      titulo: 'APARTAMENTO',
      endereco: 'CIDADE NOVA',
      valor: 300000,
      quartos: 2,
      banheiros: 1,
      vagas: 1,
      area: 80,
      areaTotal: 80,
      link: 'https://www.sueliandradelopes.com.br/imovel/456/apartamento-venda',
      site: 'sueliandradelopes.com.br',
      imagens: ['https://www.sueliandradelopes.com.br/img/test2.jpg'],
    });
  });
});

// Generate a simple mock HTML
const html = `
  <div class="imovelcard">
    <a class="imovelcard__img" href="/imovel/123/casa-venda"></a>
    <div class="imovelcard__info__ref">Ref: 001 - Casa</div>
    <div class="imovelcard__info__local">Centro, Franca / SP</div>
    <div class="imovelcard__valor__valor">R$ 500.000,00</div>
    <img src="https://example.com/img1.jpg">
    <img data-src="/img2.jpg">
    <img src="logo.png">
    <img data-src="">
    <div class="imovelcard__info__feature">3 Dormitórios</div>
    <div class="imovelcard__info__feature">2 Banheiros</div>
    <div class="imovelcard__info__feature">2 Vagas</div>
    <div class="imovelcard__info__feature">150,00 m²</div>
  </div>
  <div class="imovelcard">
    <a class="imovelcard__img" href="/imovel/124/casa-venda"></a>
    <div class="imovelcard__info__ref">Ref: 002 - Casa</div>
    <div class="imovelcard__info__local">Vila Nova, Franca / SP</div>
    <div class="imovelcard__valor__valor">R$ 0,00</div>
    <div class="imovelcard__info__feature">3 Dormitórios</div>
    <div class="imovelcard__info__feature">2 Banheiros</div>
    <div class="imovelcard__info__feature">2 Vagas</div>
    <div class="imovelcard__info__feature">150,00 m²</div>
  </div>
  <div class="imovelcard">
    <!-- Missing link -->
    <div class="imovelcard__info__ref">Ref: 003 - Casa</div>
  </div>
  <div class="imovelcard">
    <a class="imovelcard__img" href="/imovel/125/casa-venda"></a>
    <div class="imovelcard__info__ref">Ref: 004 - Casa</div>
    <div class="imovelcard__info__local">Vila Nova, Franca / SP</div>
    <div class="imovelcard__valor__valor">R$ 400.000,00</div>
    <div class="imovelcard__info__feature">Quarto</div>
    <div class="imovelcard__info__feature">1 Banheiro</div>
    <div class="imovelcard__info__feature">Vaga</div>
    <div class="imovelcard__info__feature">m²</div>
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
