import olafranca from '../src/sites/olafranca';
import atitude, { adapter } from '../src/sites/atitudeimoveisoficial';
import { parseLlmsCatalog } from '../src/sites/platforms/llmstxt';
import { sites } from '../src/sites';

const catalog = `# Atitude

### Casa - REF1
- Referência: REF1
- Tipo: Casa
- Finalidade: Locação
- Cidade: Franca
- Bairro: São José
- Valor: R$ 1.800,00
[Ver imóvel completo](http://www.atitudeimoveisoficial.com.br/imovel/1/casa)
`;

describe('atitudeimoveisoficial (ImobiBrasil, so http)', () => {
  it('mantem os links em http porque o certificado TLS do dominio nao confere', async () => {
    const { imoveis } = await adapter(catalog);
    expect(imoveis[0]).toMatchObject({ link: 'http://www.atitudeimoveisoficial.com.br/imovel/1/casa', tipo: 'aluguel', site: 'atitudeimoveisoficial.com.br' });
  });

  it('o padrao do parser continua promovendo http para https', () => {
    expect(parseLlmsCatalog(catalog, 'x').imoveis[0].link).toBe('https://www.atitudeimoveisoficial.com.br/imovel/1/casa');
  });

  it('config e registro unico', () => {
    expect(atitude).toMatchObject({ tipo: 'ambos', driver: 'axios', url: 'http://www.atitudeimoveisoficial.com.br/llms.txt' });
    expect(atitude.getPaginateParams(1)).toEqual({ url: 'http://www.atitudeimoveisoficial.com.br/llms.txt' });
    expect(sites.filter(s => s.name === 'atitudeimoveisoficial.com.br')).toHaveLength(1);
  });
});

describe('olafranca (Univen/Tokko, parser da Menezes)', () => {
  const ola = olafranca;
  const card = `<div class="resultado_novo"><a href="/comprar/sp/franca/centro/casa/1" class="botao_ver_mais"></a>
    <h3 class="titulo_novo">CASA</h3><div class="valor_novo"><small>VENDA</small><h5>R$ 300.000,00</h5></div>
    <div class="final_card"><span>Centro - Franca</span></div></div>`;

  it('config: pagina-N por finalidade e nomes unicos', () => {
    expect(ola.map(s => s.name)).toEqual(['olafranca.com.br - Comprar', 'olafranca.com.br - Alugar']);
    expect(ola[0].getPaginateParams(1)).toEqual({ url: 'https://olafranca.com.br/comprar/' });
    expect(ola[1].getPaginateParams(3)).toEqual({ url: 'https://olafranca.com.br/alugar/pagina-3/' });
    ola.forEach(s => expect(sites.filter(x => x.name === s.name)).toHaveLength(1));
  });

  it('usa o parser compartilhado com o host proprio', async () => {
    const out = await ola[0].adapter(`<html><body>${card}</body></html>` as never) as unknown as { imoveis: Array<{ link: string; valor: number }> };
    expect(out.imoveis[0]).toMatchObject({ link: 'https://olafranca.com.br/comprar/sp/franca/centro/casa/1', valor: 300000 });
  });
});
