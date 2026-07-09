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
