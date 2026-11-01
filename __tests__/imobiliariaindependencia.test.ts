import { adapter } from '../src/sites/imobiliariaindependencia';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('imobiliariaindependencia scraper adapter', () => {
  it('should parse properties correctly', async () => {
    const html = `
      <div class="card">
        <a href="/imovel/p/10"></a>
        <h3>VENDA - CENTRO</h3>
        <div class="rate-info"><h5>R$ 250.000,00</h5></div>
        <div>
           <i class="la-map-marker"></i><span>Rua Major Claudiano, 0</span>
        </div>
      </div>
    `;

    const detailHtml = `
      <img src="assets/arquivos/10/img.jpg" />
      <p>A description of the property.</p>
      <ul>
        <li>2 dormitórios</li>
        <li>1 banheiro</li>
        <li>1 vaga</li>
        <li>62 m²</li>
      </ul>
    `;

    mockedAxios.get.mockResolvedValueOnce({ data: detailHtml, status: 200, statusText: 'OK', headers: {}, config: {} } as any);

    const result = await adapter(html);

    expect(result.imoveis.length).toBe(1);
    const imovel = result.imoveis[0];

    expect(imovel.titulo).toBe('VENDA - CENTRO');
    expect(imovel.valor).toBe(250000);
    expect(imovel.quartos).toBe(2);
    expect(imovel.banheiros).toBe(1);
    expect(imovel.vagas).toBe(1);
    expect(imovel.area).toBe(62);
    expect(imovel.endereco).toBe('RUA MAJOR CLAUDIANO, 0');
    expect(imovel.imagens).toContain('assets/arquivos/10/img.jpg');
    expect(imovel.link).toBe('https://imobiliariaindependencia.com.br/imovel/p/10');
  });
});
