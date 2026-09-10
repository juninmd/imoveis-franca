import { adapter } from '../src/sites/futuraimobiliariafranca';
import site from '../src/sites/futuraimobiliariafranca';

describe('futuraimobiliariafranca adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
      <dl class="gridTypeList"><dd class="foto-lista"><div class="imput-comparar"><label><input type="checkbox" name="comparar[]" id="comparar_135" value="135" /> Comparar</label></div><a rel="nofollow" target="_self" href="/detalhes-imovel/135-apartamento-alto-padrao-venda-centro-franca-sp.html"><img class="lazyload i" width="138" data-src="/uploads/imovel/galeria/thumb-3ff0121adec0b6829aa3a6324f315bce.jpeg" alt="CASA - VENDA" /></a></dd><dd class="det-lista"><strong><a title="CASA - VENDA" target="_self" href="/detalhes.html">CASA - VENDA</a></strong><br /><span class="loc notranslate"><b>Centro</b> / <b>Franca - SP</b></span><br /><span class="cr">Cód. Referência: <b>FU56371</b></span></dd><dd class="pr-lista"><span class="valorImovel radius"><b class="notranslate">R$ 500.000,00</b>  </span></dd><a rel="nofollow" target="_self" href="/detalhes.html"><div class="caracts">Dormitórios: <b>3</b><br />Suítes: <b>1</b><br />Banheiros: <b>2</b><br />Garagens: <b>2</b></div></a></dl>
      <dl class="gridTypeList"><dd class="det-lista"><strong><a href="/detalhes2.html">APARTAMENTO</a></strong><br /><span class="loc notranslate"><b>Vila Nova</b> / <b>Franca - SP</b></span></dd><dd class="pr-lista"><span class="valorImovel radius"><b class="notranslate">R$ 0,00</b>  </span></dd><a href="/detalhes2.html"><div class="caracts"></div></a></dl>
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
    expect(result.imoveis[0].imagens[0]).toBe('https://www.futuraimobiliariafranca.com.br/uploads/imovel/galeria/thumb-3ff0121adec0b6829aa3a6324f315bce.jpeg');
  });

  it('should parse html with alternate encoding and layout', async () => {
    const html = `
      <dl class="gridTypeList"><dd class="det-lista"><strong><a title="CASA" target="_self" href="http://other.com/1">CASA</a></strong><br /><span class="loc">Jardim Teste / Franca - SP</span><br /><span class="cr">Cód. Refer�ncia: <b>FU1</b></span></dd><dd class="pr-lista"><span class="valorImovel radius"><b class="notranslate">R$ 250.000,00</b>  </span></dd><dd class="foto-lista"><img class="lazyload i" data-src="/img1.jpg" /></dd><a href="http://other.com/1"><div class="caracts">Dormit�rios: <b>2</b><br />Banheiros: <b>1</b><br />Garagens: <b>1</b></div></a></dl>
      <dl class="gridTypeList"><dd class="det-lista"><strong><a></a></strong></dd></dl>
      <dl class="gridTypeList"></dl>
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
