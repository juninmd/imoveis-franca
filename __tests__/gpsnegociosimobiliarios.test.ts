import site, { adapter } from '../src/sites/gpsnegociosimobiliarios';

describe('gpsnegociosimobiliarios scraper adapter', () => {
  it('should parse html correctly', async () => {
    const html = `
    <html>
      <body>
        <div class="col-12 col-md-3 mb-4">
            <a href="imovel.php?IdImovel=3630" target="_blank">
                <div class="card" style="padding: 15px; border-radius: 3%">
                    <div class="card-img hovereffect" style="cursor: pointer; width: 100%; height: 200px; background-image: url('assets/img/imoveis/747546febc97321feb449731402144570.jpeg'); background-size: cover; background-position: center;"></div>
                    <div class="card-body">
                        <h4 style="margin: 0; font-weight: 700;">Lote à venda no Jardim Arizona | 200 m² | Venda de direitos em Franca/SP</h4>
                        <h6 style="margin: 5px 0 10px 0;  font-weight: 700;">Terreno</h6>
                        <h3><i class="fas fa-money-bill-wave"></i> R$ 50.000,00</h3>
                        <p><i class="fas fa-window-maximize"></i> Código: 80881</p>
                    </div>
                </div>
            </a>
        </div>
      </body>
    </html>
    `;
    const result = await adapter(html);
    expect(result.imoveis).toHaveLength(1);
    expect(result.imoveis[0].valor).toBe(50000);
    expect(result.imoveis[0].titulo).toBe('Lote à venda no Jardim Arizona | 200 m² | Venda de direitos em Franca/SP');
    expect(result.imoveis[0].endereco).toBe('LOTE A VENDA NO JARDIM ARIZONA | 200 M² | VENDA DE DIREITOS EM FRANCA/SP');
    expect(result.imoveis[0].imagens[0]).toBe('https://www.gpsnegociosimobiliarios.com.br/assets/img/imoveis/747546febc97321feb449731402144570.jpeg');
  });

  it('should handle edge cases', async () => {
    const html = `
    <html>
      <body>
        <!-- 1. sob consulta uppercase -->
        <div class="card">
           <a href="link1"><h4>SemTracoVirgula</h4><h6>t</h6><h3 class="preco">Valor Sob Consulta</h3><p></p></a>
        </div>
        <!-- 2. sob consulta lowercase -->
        <div class="card">
           <a href="link1"><h4>SemTracoVirgula</h4><h6>t</h6><h3 class="preco">sob consulta</h3><p></p></a>
        </div>
        <!-- 3. empty price -->
        <div class="card">
           <a href="link1"><h4>SemTracoVirgula</h4><h6>t</h6><h3 class="preco">   </h3><p></p></a>
        </div>
        <!-- 4. empty price 2 -->
        <div class="card">
           <a href="link2"><h4>SemTracoVirgula</h4><h6>t</h6><h3></h3><p></p></a>
        </div>
        <!-- 5. non-numeric price -->
        <div class="card">
           <a href="link2"><h4>SemTracoVirgula</h4><h6>t</h6><h3>R$ a</h3><p></p></a>
        </div>
        <!-- 6. card without a valid href -->
        <div class="card">
           <h4>SemTracoVirgula</h4><h6>t</h6><h3>R$ 10</h3><p></p>
        </div>
        <!-- 7. value 0 -->
        <div class="card">
           <a href="link3"><h4>SemTracoVirgula</h4><h6>t</h6><h3>R$ 0</h3><p></p></a>
        </div>
        <!-- 8. empty href -->
        <div class="card">
           <a href=""><h4>SemTracoVirgula</h4><h6>t</h6><h3>R$ 10</h3><p></p></a>
        </div>
        <!-- 9. value 0.0 -->
        <div class="card">
           <a href="link4"><h4>SemTracoVirgula</h4><h6>t</h6><h3>R$ 0,0</h3><p></p></a>
        </div>
        <!-- 10. price R$ without numbers -->
        <div class="card">
           <a href="link4"><h4>SemTracoVirgula</h4><h6>t</h6><h3>R$ </h3><p></p></a>
        </div>
        <!-- 11. card without image, valid price -->
        <div class="col-12 col-md-3 mb-4">
            <a href="imovel.php?IdImovel=3631" target="_blank">
                <div class="card">
                    <div class="card-img hovereffect"></div>
                    <div class="card-body">
                        <h4>ApenasTituloSemTracoSemVirgula</h4>
                        <h6>Terreno</h6>
                        <h3>R$ 50.000,00</h3>
                        <p>3 dormitórios</p>
                    </div>
                </div>
            </a>
        </div>
        <!-- 12. image with quotes and valid price, title with comma -->
        <div class="col-12 col-md-3 mb-4">
            <a href="imovel.php?IdImovel=3631" target="_blank">
                <div class="card">
                    <div class="card-img hovereffect" style='background-image: url("img.jpg");'></div>
                    <div class="card-body">
                        <h4>Titulo, Franca</h4>
                        <h6>Terreno</h6>
                        <h3>R$ 50.000,00</h3>
                        <p>1 dormitório</p>
                    </div>
                </div>
            </a>
        </div>
      </body>
    </html>
    `;
    const result = await adapter(html);
    // Should have 2 valid imoveis at the end
    expect(result.imoveis).toHaveLength(2);
    expect(result.imoveis[0].endereco).toBe('APENASTITULOSEMTRACOSEMVIRGULA');
    expect(result.imoveis[0].quartos).toBe(3);
    expect(result.imoveis[1].imagens[0]).toBe('https://www.gpsnegociosimobiliarios.com.br/img.jpg');
    expect(result.imoveis[1].quartos).toBe(1);
    expect(result.imoveis[1].endereco).toBe('TITULO');
  });

  it('getPaginateParams should return the correct url', () => {
    expect(site.getPaginateParams(2)).toEqual({ url: 'https://www.gpsnegociosimobiliarios.com.br/imoveis.php?page=2' });
  });
});
