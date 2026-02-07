import axios from 'axios';
import { adapter } from '../src/sites/imoveismpb';

jest.mock('axios');

describe('Imoveis MPB Adapter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse listing and fetch details', async () => {
    const listHtml = `
      <span class="h-money">10 Imóveis</span>
      <a href="/imovel/venda/casa-centro">Ver</a>
    `;

    const detailsHtml = `
      <html>
        <body>
          <h1 class="text-8 font-weight-bold">Casa no Centro</h1>
          <div class="col-md-12 mb-4">
            <p class="text-4">Centro, Franca</p>
          </div>
          <span class="text-color-primary font-weight-bold text-6">R$ 600.000,00</span>
          <div class="imovel-descricao">Descricao</div>
          <div class="thumb-gallery-detail">
            <a href="#"><img src="img1.jpg"></a>
          </div>
          <ul>
            <li>300 m² total</li>
            <li>200 m² útil</li>
            <li>3 quartos</li>
            <li>2 banheiros</li>
            <li>2 vagas</li>
          </ul>
        </body>
      </html>
    `;

    (axios.get as jest.Mock).mockResolvedValue({ data: detailsHtml });

    const result = await adapter(listHtml);

    expect(result.qtd).toBe(10);
    expect(result.imoveis).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledTimes(1);

    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('CASA NO CENTRO');
    expect(imovel.valor).toBe(600000);
    expect(imovel.area).toBe(200);
    expect(imovel.areaTotal).toBe(300);
    expect(imovel.quartos).toBe(3);
    expect(imovel.endereco).toBe('CENTRO');
  });
});
