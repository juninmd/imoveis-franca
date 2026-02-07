import { adapter } from '../src/sites/espaconobreimoveis';

describe('Espaco Nobre Adapter', () => {
  it('should parse JSON response correctly', async () => {
    const mockJson = {
      contador: 2,
      imoveis: [
        {
          _id: '123',
          sigla: 'CASA-123',
          tipo: 'Casa',
          imobiliaria: { _id: 'imo1' },
          local: {
            bairro: 'Centro',
            cidade: 'Franca'
          },
          comercializacao: {
            venda: {
              ativa: true,
              preco: 500000
            }
          },
          numeros: {
            dormitorios: 3,
            banheiros: 2,
            vagas: 2,
            areas: {
              construida: 200,
              terreno: 300
            }
          },
          midia: {
            imagens: ['img1.jpg']
          }
        }
      ]
    };

    const result = await adapter(mockJson);

    expect(result.qtd).toBe(2);
    expect(result.imoveis).toHaveLength(1);
    const imovel = result.imoveis[0];
    expect(imovel.titulo).toBe('CASA');
    expect(imovel.valor).toBe(500000);
    expect(imovel.quartos).toBe(3);
    expect(imovel.endereco).toBe('CENTRO');
    expect(imovel.site).toBe('espaconobreimoveis.com.br');
  });
});
