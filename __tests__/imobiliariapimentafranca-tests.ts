import axios from 'axios';
import { adapter } from '../src/sites/imobiliariapimentafranca';

jest.mock('axios');

describe('Imobiliaria Pimenta Franca Adapter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse HTML and fetch details correctly', async () => {
    const listHtml = `
      <script>var count = 2;</script>
      <div id="listar_grade">
        <div class="imovel-item">
          <div class="item_info">
            <h3><a href="/imovel/123/casa-padrao">Casa Padrão</a></h3>
            <div class="item_address">
              <p>Rua Teste, 100</p>
              <p>Bairro: Centro</p>
              <p>Cidade: Franca - SP</p>
            </div>
            <div class="main-characteristics-list">
              <div><span>
                <svg viewBox="0 0 512 512"><path d="M174.9 494.1c-18.7 18.7-49.1 18.7-67.9 0"></path></svg>
                <span class="carac-name-list">200 m²</span>
              </span></div>
              <div><span>
                <svg viewBox="0 0 640 512"><path d="M32 32c17.7 0 32 14.3 32 32V320H288V160c0-17.7 14.3-32 32-32H544"></path></svg>
                <span class="carac-name-list">3</span>
              </span></div>
              <div><span>
                <svg viewBox="0 0 448 512"><path d="M24 0C10.7 0 0 10.7 0 24S10.7 48 24 48h8V196.9c-1.9 1.4"></path></svg>
                <span class="carac-name-list">2</span>
              </span></div>
              <div><span>
                <svg viewBox="0 0 515 515"><path d="M135.2 117.4L109.1 192H402.9l-26.1-74.6"></path></svg>
                <span class="carac-name-list">1</span>
              </span></div>
            </div>
            <div class="item_prices">
              <dl><dt>Venda (R$)</dt><dd>500.000,00</dd></dl>
            </div>
          </div>
        </div>
      </div>
      <div id="listar_lista">
        <div class="imovel-item">
          <div class="item_info">
            <h3><a href="/imovel/123/casa-padrao">Casa Padrão (lista)</a></h3>
          </div>
        </div>
      </div>
    `;

    const detailsHtml = `
      <html>
        <body>
          <div id="gallery-1">
            <a class="rsImg"><img src="img1.jpg" /></a>
          </div>
          <div class="item-imovel">Descrição detalhada</div>
        </body>
      </html>
    `;

    (axios.get as jest.Mock).mockResolvedValue({ data: detailsHtml });

    const result = await adapter(listHtml);

    expect(result.qtd).toBe(2);

    // Only the #listar_grade item is extracted (the #listar_lista duplicate must not be counted)
    expect(result.imoveis).toHaveLength(1);

    const validImovel = result.imoveis.find(i => i.titulo === 'Casa Padrão');
    expect(validImovel).toBeDefined();

    if (validImovel) {
      expect(validImovel.valor).toBe(500000);
      expect(validImovel.endereco).toBe('CENTRO');
      expect(validImovel.area).toBe(200);
      expect(validImovel.quartos).toBe(3);
      expect(validImovel.banheiros).toBe(2);
      expect(validImovel.vagas).toBe(1);
      expect(validImovel.link).toBe('https://www.imobiliariapimentafranca.com.br/imovel/123/casa-padrao');
      expect(validImovel.imagens).toContain('img1.jpg');
    }
  });

  it('should return no imoveis when the listing grid is empty', async () => {
    const listHtml = `
      <script>var count = 0;</script>
      <div id="listar_grade"></div>
    `;

    const result = await adapter(listHtml);

    expect(result.qtd).toBe(0);
    expect(result.imoveis).toEqual([]);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
