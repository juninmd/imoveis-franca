import axios from 'axios';
import { adapter } from '../src/sites/imobiliariapimentafranca';

jest.mock('axios');

describe('Imobiliaria Pimenta Franca Adapter', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should parse HTML and fetch details correctly', async () => {
    const listHtml = `
      <div class="cabecalho">
        <div><strong>2 Imóveis</strong></div>
      </div>

      <div class="item-lista"> <!-- Loop Element -->

        <div>Spacer 1</div>

        <!-- This is div:nth-child(2) of Loop Element -->
        <!-- It must have class 'item-lista' to match title selector -->
        <div class="item-lista">

          <!-- Address Selector: div:nth-child(2) > a:nth-child(1) > h3 -->
          <!-- This 'a' is the first child of this div -->
          <a href="#">
             <h3>Centro, Franca</h3>
          </a>

          <!-- Title Selector: div.item-lista:nth-child(2) > div:nth-child(2) > a:nth-child(1) > small:nth-child(2) -->
          <!-- We need a 2nd child div here -->
          <div> <!-- div:nth-child(2) of the inner item-lista -->
             <a href="#">
               <small>Prefix</small>
               <small>Casa Padrão</small>
             </a>
          </div>

        </div>

        <div class="desc-item-lista">
          <ul></ul>
          <ul><a href="#"><li>R$ 500.000,00</li></a></ul>
        </div>
        <div class="icones ico2">
          <a data-tooltip="Área">200 m²</a>
          <a data-tooltip="Dormitórios">3</a>
          <a data-tooltip="Banheiros">2</a>
          <a data-tooltip="Vagas">1</a>
        </div>
        <a class="btver cor0" href="/imovel/123">Ver</a>
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

    // We expect the valid property to be found
    const validImovel = result.imoveis.find(i => i.titulo === 'Casa Padrão');
    expect(validImovel).toBeDefined();

    if (validImovel) {
        expect(validImovel.valor).toBe(500000);
        expect(validImovel.endereco).toBe('CENTRO');
        expect(validImovel.quartos).toBe(3);
        expect(validImovel.imagens).toContain('img1.jpg');
    }
  });
});
