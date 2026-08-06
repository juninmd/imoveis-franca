import { adapter } from '../src/sites/futuraimobiliariafranca';
import site from '../src/sites/futuraimobiliariafranca';

describe('futuraimobiliariafranca adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <dl class="gridTypeList">
        <dd class="det-lista">
          <strong><a href="/detalhes.html">CASA - VENDA</a></strong>
          <span class="loc b">Centro</span>
          <span class="valorImovel radius"><b>R$ 500.000,00</b></span>
        </dd>
        <a href="/detalhes.html">
          <div class="caracts">
            Dormitórios: <b>3</b>
            Suítes: <b>1</b>
            Banheiros: <b>2</b>
            Garagens: <b>2</b>
          </div>
        </a>
      </dl>
      <dl class="gridTypeList">
        <dd class="det-lista">
          <strong><a href="/detalhes2.html">APARTAMENTO</a></strong>
          <span class="loc">Vila Nova / Franca - SP</span>
          <span class="valorImovel radius"><b>R$ 0,00</b></span>
        </dd>
      </dl>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].titulo).toBe('CASA - VENDA');
    expect(result.imoveis[0].endereco).toBe('CENTRO');
    expect(result.imoveis[0].valor).toBe(500000);
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[0].banheiros).toBe(2);
    expect(result.imoveis[0].vagas).toBe(2);
    expect(result.imoveis[0].link).toBe('https://www.futuraimobiliariafranca.com.br/detalhes.html');
  });

  it('should parse html with alternate encoding and layout', async () => {
    const html = `
      <dl class="gridTypeList">
        <dd class="det-lista">
          <strong><a href="http://other.com/1">CASA</a></strong>
          <span class="loc b"></span>
          <span class="loc">Jardim Teste / Franca - SP</span>
          <span class="valorImovel radius"><b>R$ 250.000,00</b></span>
        </dd>
        <dd class="foto-lista">
          <img class="lazyload" data-src="/img1.jpg" />
        </dd>
        <a href="http://other.com/1">
          <div class="caracts">
            Dormitrios: <b>2</b>
            Banheiros: <b>1</b>
            Garagens: <b>1</b>
          </div>
        </a>
      </dl>
      <dl class="gridTypeList">
        <dd class="det-lista">
          <strong><a></a></strong>
        </dd>
      </dl>
      <dl class="gridTypeList">
      </dl>
    `;
    const result = await adapter(html);
    expect(result.imoveis.length).toBe(1);
    expect(result.imoveis[0].endereco).toBe('JARDIM TESTE');
    expect(result.imoveis[0].quartos).toBe(2);
    expect(result.imoveis[0].imagens[0]).toBe('https://www.futuraimobiliariafranca.com.br/img1.jpg');
    expect(result.imoveis[0].link).toBe('http://other.com/1');
  });

  it('should return getPaginateParams', () => {
    expect(site.getPaginateParams(2)).toEqual({ url: 'https://www.futuraimobiliariafranca.com.br/secao/venda?page=2' });
  });
});
