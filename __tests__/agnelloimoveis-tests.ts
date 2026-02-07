import { adapter } from '../src/sites/agnelloimoveis';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('adapter function', () => {
  it('should return an object with imoveis and qtd properties', async () => {
    const html = `
      <div>
        <h1 class="titulo_res_busca">10 imóveis encontrados</h1>
        <div class="item col-sm-6 col-md-4 col-lg-3">
           <a href="fake-link" title="CASA PADRAO"></a>
           <h3><small>Bairro: Centro</small></h3>
           <div class="price"><span>R$ 500.000,00</span></div>
           <div class="amenities">
              <ul class="imo-itens">
                <li title="3 Quartos"></li>
                <li title="2 Banheiros"></li>
                <li title="2 Vagas"></li>
              </ul>
           </div>
        </div>
      </div>
    `;

    // Mock axios response for the details page
    mockedAxios.get.mockResolvedValue({
      data: `
        <div class="row">
           <div class="carousel">
              <a href="#"><img src="img1.jpg"></a>
           </div>
           <div class="main">
              <div>
                 <div>
                    <small>A. Útil</small>
                    100 M²
                 </div>
                 <div>
                    <small>A. Terreno</small>
                    200 M²
                 </div>
              </div>
              <p id="descricao_imovel">Linda casa</p>
           </div>
        </div>
      `,
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    } as any);

    const result = await adapter(html);

    expect(result).toHaveProperty('imoveis');
    expect(result).toHaveProperty('qtd');
    expect(result.qtd).toBe(10);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('CASA');
  });
});
