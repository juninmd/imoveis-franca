import quintare, { adapter } from '../src/sites/quintareimoveis';

const card = (id: string, local: string, valor: string) => `
  <div class="imovelcard" data-link="/imovel/${id}/casa-venda">
    <div class="row">
      <a href="/imovel/${id}/casa-venda" title="Casa para Venda, bairro X" class="col imovelcard__img">
        <img src="https://cdn.example.com/${id}.jpeg">
      </a>
      <div class="col imovelcard__infocontainer">
        <h2 class="imovelcard__info__tag">Venda</h2>
        <h2 class="imovelcard__info__local">${local}</h2>
        <p class="imovelcard__info__ref"><strong>Ref: 4005</strong> - Casa</p>
        <div class="imovelcard__info__feature"><p><b>3</b> <span>Dormit�rios</span></p></div>
        <div class="imovelcard__info__feature"><p><b>2</b> <span>Banheiros</span></p></div>
        <div class="imovelcard__info__feature"><p><b>2</b> <span>Vagas</span></p></div>
        <div class="imovelcard__info__feature"><p><b>99 m&sup2;</b> Constru&iacute;do</p></div>
        <div class="imovelcard__valor"><p class="imovelcard__valor__valor"><span>R$</span> ${valor}</p></div>
      </div>
    </div>
  </div>`;

describe('quintareimoveis', () => {
    it('should parse html correctly', async () => {
        const html = `
            <body>
                <p class="topsearch__total"><strong>226</strong> im&oacute;veis encontrados. P&aacute;gina 1</p>
                ${card('4461830', 'Residencial Zanetti, Franca / SP', '460.000')}
            </body>
        `;
        const result = await adapter(html);
        expect(result.qtd).toBe(226);
        expect(result.imoveis).toHaveLength(1);
        const im = result.imoveis[0];
        expect(im.titulo).toBe('Casa para Venda, bairro X');
        expect(im.endereco).toBe('RESIDENCIAL ZANETTI');
        expect(im.valor).toBe(460000);
        expect(im.area).toBe(99);
        expect(im.quartos).toBe(3);
        expect(im.banheiros).toBe(2);
        expect(im.vagas).toBe(2);
        expect(im.link).toBe('https://quintareimoveis.com.br/imovel/4461830/casa-venda');
        expect(im.imagens).toEqual(['https://cdn.example.com/4461830.jpeg']);
    });

    it('should ignore other cities, cards without city and zero price', async () => {
        const html = `
            <body>
                <p class="topsearch__total"><strong>10</strong> im&oacute;veis encontrados.</p>
                ${card('1', 'Rio Sol Exclusive, Sacramento / MG', '1.000.000')}
                ${card('2', 'ESPRAIADO', '300.000')}
                ${card('3', 'Centro, Franca / SP', '0')}
                ${card('4', 'Centro, Franca / SP', '1.200.000')}
            </body>
        `;
        const result = await adapter(html);
        expect(result.imoveis).toHaveLength(1);
        expect(result.imoveis[0].valor).toBe(1200000);
    });

    it('should paginate with pag param', () => {
        expect(quintare.getPaginateParams(3)).toEqual({ url: 'https://quintareimoveis.com.br/imovel/?finalidade=venda&pag=3' });
    });

    it('should return empty if no imoveis', async () => {
        const html = `<body><p class="topsearch__total"><strong>0</strong> im&oacute;veis encontrados.</p></body>`;
        const result = await adapter(html);
        expect(result.qtd).toBe(0);
        expect(result.imoveis).toHaveLength(0);
    });
});
