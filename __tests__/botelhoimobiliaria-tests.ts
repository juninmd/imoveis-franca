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
        <p>9 opções encontradas para <strong>Venda</strong>.</p>
        <div onclick="window.location='imovel.php?id=10'"
             class="group cursor-pointer bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm">
            <div class="relative aspect-[4/3] overflow-hidden">
                <img src="uploads/capa.jpg" class="w-full h-full object-cover">
                <div class="absolute top-6 left-6 flex gap-2 flex-wrap">
                    <span class="bg-white/90 text-on-surface text-[10px] font-black">VENDA</span>
                    <span class="bg-primary/90 text-white text-[10px] font-black">Centro</span>
                </div>
            </div>
            <div class="p-8">
                <h4 class="text-2xl font-headline font-black mb-3">Casa Venda Franca</h4>
                <p class="text-tertiary text-sm flex items-center gap-2 mb-4">
                    <span class="material-symbols-outlined text-primary text-base">location_on</span>
                    Centro                </p>
                <div class="flex flex-wrap gap-2 mb-4">
                    <span>3 quarto(s)</span>
                    <span>2 banh.</span>
                    <span>1 vaga(s)</span>
                    <span>100 m²</span>
                </div>
                <p class="text-primary font-black text-2xl">R$ 500.000,00</p>
            </div>
        </div>
        <div onclick="window.location='imovel.php?id=11'"
             class="group cursor-pointer bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-sm">
            <div class="relative aspect-[4/3] overflow-hidden">
                <img src="uploads/capa2.jpg" class="w-full h-full object-cover">
                <div class="absolute top-6 left-6 flex gap-2 flex-wrap">
                    <span class="bg-white/90 text-on-surface text-[10px] font-black">LOCAÇÃO</span>
                    <span class="bg-primary/90 text-white text-[10px] font-black">Centro</span>
                </div>
            </div>
            <div class="p-8">
                <h4 class="text-2xl font-headline font-black mb-3">Apartamento Locacao Franca</h4>
                <p class="text-tertiary text-sm flex items-center gap-2 mb-4">
                    <span class="material-symbols-outlined text-primary text-base">location_on</span>
                    Centro                </p>
                <div class="flex flex-wrap gap-2 mb-4">
                    <span>2 quarto(s)</span>
                    <span>50 m²</span>
                </div>
                <p class="text-primary font-black text-2xl">1.500,00<span class="text-xs">/mês</span></p>
            </div>
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
            <p class="text-primary">R$ 300.000,00</p>
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
            <p class="text-primary">R$ 100.000,00</p>
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
            <p class="text-primary">R$ 100.000,00</p>
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
            <p class="text-primary">R$ 100.000,00</p>
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
