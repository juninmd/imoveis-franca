
import { adapter as pereiraAdapter } from '../src/sites/imobiliariapereira';
import { adapter as pauloAdapter } from '../src/sites/pauloborgesimoveis';
import { adapter as colinaAdapter } from '../src/sites/colinaimoveis';
import { adapter as novaesAdapter } from '../src/sites/novaesimoveis';

describe('New Sites Coverage', () => {
    it('imobiliariapereira', async () => {
        const html = `<div class="card-imovel">
            <h3>Casa Bonita</h3>
            <a href="/imovel/123">Link</a>
            <img src="img.jpg">
            <p>R$ 100.000</p>
            <p class="subtitle-description">CENTRO, Franca - SP</p>
            <p>2 Quartos</p>
        </div>`;
        const result = await pereiraAdapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].titulo).toBe('Casa Bonita');
        expect(result.imoveis[0].valor).toBe(100000);

        const htmlEmpty = `<div>No results</div>`;
        const resultEmpty = await pereiraAdapter(htmlEmpty);
        expect(resultEmpty.imoveis.length).toBe(0);
    });

    it('pauloborges', async () => {
        const html = `<div>
            <a href="/imovel/123">
                <h2>Casa Linda</h2>
                <img src="img.jpg">
                <p>CENTRO, Franca - SP</p>
                <p>2 Quartos</p>
                <p>R$ 150.000</p>
            </a>
        </div>`;
        const result = await pauloAdapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(150000);
    });

    it('colinaimoveis', async () => {
        const html = `<div>
            <a href="/imovel/456">
                <h2>Apartamento Top</h2>
                <img src="img.jpg">
                <p>VILA NOVA, Franca - SP</p>
                <p>3 Quartos</p>
                <p>R$ 250.000</p>
            </a>
        </div>`;
        const result = await colinaAdapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(250000);
    });

    it('novaesimoveis', async () => {
        const html = `<div>
            <a href="/imovel/789">
                <h2>Sobrado</h2>
                <img src="img.jpg">
                <p>CIDADE NOVA, Franca - SP</p>
                <p>4 Quartos</p>
                <p>R$ 500.000</p>
            </a>
        </div>`;
        const result = await novaesAdapter(html);
        expect(result.imoveis.length).toBe(1);
        expect(result.imoveis[0].valor).toBe(500000);
    });
});
