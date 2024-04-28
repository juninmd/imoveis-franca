import { adapter } from '../src/sites/agnelloimoveis'; // Substitua 'seu-arquivo-de-codigo' pelo caminho real do seu arquivo

// https://www.agnelloimoveis.com.br/comprar/Franca/Casa/Bairro/Jardim-Elisa/7986
describe('adapter function', () => {
  it('should return an object with imoveis and qtd properties', async () => {
    // Mock do parâmetro 'html' para simular o comportamento da função 'cheerio.load'
    const html = `
      <div>
        <h1 class="titulo_res_busca">10 imóveis encontrados</h1>
        <div class="item col-sm-6 col-md-4 col-lg-3">
          <!-- Simular os elementos HTML necessários para o seu teste -->
        </div>
        <!-- Adicione mais elementos HTML de exemplo, conforme necessário -->
      </div>
    `;

    // Chamar a função 'adapter' com o HTML mockado
    const result = await adapter(html);

    // Verificar se o resultado contém as propriedades esperadas
    expect(result).toHaveProperty('imoveis');
    expect(result).toHaveProperty('qtd');
    expect(Array.isArray(result.imoveis)).toBe(true);
    expect(typeof result.qtd).toBe('number');
  });

  // Adicione mais testes conforme necessário para cobrir outros cenários
});
