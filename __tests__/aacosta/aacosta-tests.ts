import axios from 'axios';
import { adapter } from '../../src/sites/aacosta';
import html from './content';

// Mock axios to prevent real network requests during testing
jest.mock('axios');

// https://www.aacosta.com.br/listagem.jsp?negociacao=2&tipo=1&cidade=1&lblCodigo=&btnI=
describe('adapter function', () => {
  beforeEach(() => {
    // Setup a default mock response for any axios.get call
    (axios.get as jest.Mock).mockResolvedValue({
      data: `
        <html>
          <body>
            <div id="lightgallery">
              <a href="#"><img src="image1.jpg"></a>
            </div>
            <div class="property-meta entry-meta clearfix">
              <div><span>Unknown</span></div>
              <div><span class="property-info-value"> 300 m² </span></div>
              <div><span class="property-info-value"> 200 m² </span></div>
              <div><span>Unknown</span></div>
              <div><span class="property-info-value"> 2 </span></div>
            </div>
            <div class="s-property-content">
              <p>1 banheiro</p>
              Descrição do imóvel
            </div>
          </body>
        </html>
      `
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return an object with imoveis and qtd properties', async () => {
    // Chamar a função 'adapter' com o HTML mockado
    const result = await adapter(html);

    // Verificar se o resultado contém as propriedades esperadas
    expect(result).toHaveProperty('imoveis');
    expect(result).toHaveProperty('qtd');
    expect(Array.isArray(result.imoveis)).toBe(true);
    expect(typeof result.qtd).toBe('number');

    // Validate that axios was called for the details pages
    // The number of calls depends on how many items are in 'html'
    expect(axios.get).toHaveBeenCalled();
  });

  // Adicione mais testes conforme necessário para cobrir outros cenários
});
