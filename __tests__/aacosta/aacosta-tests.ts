import { adapter } from '../../src/sites/aacosta';
import html from './content';

// https://www.aacosta.com.br/listagem.jsp?negociacao=2&tipo=1&cidade=1&lblCodigo=&btnI=
describe('adapter function', () => {
  it('should return an object with imoveis and qtd properties', async () => {

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
