import site from '../src/sites/agessani';

describe('agessani', () => {
    it('should parse data correctly', async () => {
        const html = `<div class="grid-9 caixa-imovel"><div class="item-lista">
  <div class="img-item-lista"><img src="/imagens/imoveis/a.png"></div>
  <div class="desc-item-lista"><h3>Centro, Franca / SP</h3>
  <table><tr>
   <td><a data-tooltip="&Aacute;rea">522 m&sup2;</a></td>
   <td><a data-tooltip="Dormit&oacute;rios">3</a></td>
   <td><a data-tooltip="Banheiros">1</a></td>
   <td><a data-tooltip="Vagas">2</a></td>
  </tr></table>
  <ul><li>R$ 500.000,00</li><li><a href="/imovel/123/casa-venda" title="Casa Legal" class="btver">Ver Detalhes</a></li></ul>
  </div></div></div>`;
        const result = await site.adapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(500000);
        expect(result.imoveis[0].area).toBe(522);
        expect(result.imoveis[0].quartos).toBe(3);
        expect(result.imoveis[0].vagas).toBe(2);
        expect(result.imoveis[0].banheiros).toBe(1);
        expect(result.imoveis[0].link).toBe('https://www.agessani.com/imovel/123/casa-venda');
    });

    it('should return getPaginateParams', () => {
        expect(site.getPaginateParams(2)).toEqual({ url: 'https://www.agessani.com/imovel/venda/?pag=2' });
    });
});
