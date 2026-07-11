import { adapter } from '../src/sites/botelhoimobiliaria';
import botelhoimobiliaria from '../src/sites/botelhoimobiliaria';

describe('Botelho Imobiliaria Adapter', () => {
  it('should get correct paginate params', () => {
    expect(botelhoimobiliaria.getPaginateParams(1)).toEqual({
      url: 'https://www.botelhoimobiliaria.com.br/imoveis.php?negocio=venda&page=1'
    });
  });

  it('should parse HTML correctly', async () => {
    const mockHtml = `
      <body>
        <div>9 opções encontradas para Venda.</div>
        <div class="group cursor-pointer" onclick="window.location='imovel.php?id=10'">
            <h4>Casa Venda Franca</h4>
            <div class="text-primary font-black text-2xl">R$ 500.000,00</div>
            <div class="flex-wrap gap-2">
                <span>3 quarto(s)</span>
                <span>2 banh.</span>
                <span>1 vaga(s)</span>
                <span>100 m²</span>
            </div>
            <p><span class="material-symbols-outlined">location_on</span>Centro</p>
            <img src="uploads/capa.jpg" />
        </div>
        <div class="group cursor-pointer" onclick="window.location='imovel.php?id=11'">
            <h4>Apartamento Locacao Franca</h4>
            <div class="text-primary font-black text-2xl">R$ 1.500,00 /mês</div>
            <div class="flex-wrap gap-2">
                <span>LOCAÇÃO</span>
                <span>2 quarto(s)</span>
                <span>50 m²</span>
            </div>
            <p><span class="material-symbols-outlined">location_on</span>Centro</p>
            <img src="uploads/capa2.jpg" />
        </div>
      </body>
    `;

    const { imoveis, qtd } = await adapter(mockHtml);

    expect(qtd).toBe(9);
    expect(imoveis).toHaveLength(1); // Only 1 for sale
    expect(imoveis[0]).toEqual(expect.objectContaining({
      titulo: 'Casa Venda Franca',
      valor: 500000,
      quartos: 3,
      banheiros: 2,
      vagas: 1,
      area: 100,
      areaTotal: 100,
      link: 'https://www.botelhoimobiliaria.com.br/imovel.php?id=10',
      endereco: 'CENTRO',
      imagens: ['https://www.botelhoimobiliaria.com.br/uploads/capa.jpg'],
      site: 'botelhoimobiliaria.com.br',
      entrada: 100000
    }));
  });

  it('should handle edge cases and missing fields', async () => {
    const mockHtml = `
      <body>
        <!-- Missing quantity -->
        <a class="group" href="imovel.php?id=99">
            <h4 class="font-black"></h4> <!-- No title -->
        </a>
        <a class="group" href="https://other.com/imovel.php?id=12">
            <h4 class="font-black">Imovel com titulo mas sem location ou tag</h4>
            <div class="text-primary">R$ 300.000,00</div>
            <img src="https://img.com/capa3.jpg" />
        </a>
      </body>
    `;

    const { imoveis, qtd } = await adapter(mockHtml);

    expect(qtd).toBe(0);
    expect(imoveis).toHaveLength(1);
    expect(imoveis[0].titulo).toBe('Imovel com titulo mas sem location ou tag');
    expect(imoveis[0].link).toBe('https://other.com/imovel.php?id=12');
    expect(imoveis[0].imagens).toEqual(['https://img.com/capa3.jpg']);
    expect(imoveis[0].endereco).toBe('IMOVEL COM TITULO MAS SEM LOCATION OU TAG');
  });

  it('should handle location node edge case', async () => {
      const mockHtml = `
      <body>
        <a class="group" href="imovel.php?id=13">
            <h4>Title</h4>
            <div class="text-primary">R$ 100.000,00</div>
            <div>
               <span class="material-symbols-outlined">location_on</span>
               <span>Some invalid node</span>
               CityName
            </div>
        </a>
      </body>
      `;
      const { imoveis } = await adapter(mockHtml);
      expect(imoveis[0].endereco).toBe('CITYNAME');
  });

  it('should handle location node edge case without proper text node', async () => {
      const mockHtml = `
      <body>
        <a class="group" href="imovel.php?id=14">
            <h4>Title2</h4>
            <div class="text-primary">R$ 100.000,00</div>
            <div>
               <span class="material-symbols-outlined">location_on</span>
            </div>
        </a>
      </body>
      `;
      const { imoveis } = await adapter(mockHtml);
      expect(imoveis[0].endereco).toBe('TITLE2'); // Fallback to title
  });

  it('should handle very long location strings and fallback', async () => {
      const longStr = "A".repeat(60);
      const mockHtml = `
      <body>
        <a class="group" href="imovel.php?id=15">
            <h4>My Title</h4>
            <div class="text-primary">R$ 100.000,00</div>
            <div>
               <span class="material-symbols-outlined">location_on</span>${longStr}
            </div>
        </a>
      </body>
      `;
      const { imoveis } = await adapter(mockHtml);
      expect(imoveis[0].endereco).toBe('MY TITLE'); // Because normalization makes it uppercase
  });
});
