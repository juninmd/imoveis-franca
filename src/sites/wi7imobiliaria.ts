import { Site } from '../types';
import * as cheerio from 'cheerio';
import { getFixValue } from '../utils';

const site: Site = {
  name: 'wi7imobiliaria',
  url: 'https://www.wi7imobiliaria.com.br',
  driver: 'axios',
  enabled: true,
  itemsPerPage: 12,
  getPaginateParams: (page: number) => {
    return {
      path: `/imoveis/a-venda/pagina/${page}`,
    };
  },
  adapter: async (html: string) => {
    const $ = cheerio.load(html);
    const imoveis: any[] = [];

    const parsePrice = (priceStr: string) => {
        const cleaned = priceStr.replace(/R\$/gi, '').replace(/\./g, '').replace(/,/g, '.').trim();
        return parseFloat(cleaned) || 0;
    };

    $('.col-lg-4.col-md-4.col-sm-6').each((_i, el) => {
        const titleElem = $(el).find('h3');
        const title = titleElem.text().trim();
        if (!titleElem.length) return;

        const linkElem = $(el).find('a');
        const href = linkElem.attr('href');
        if (!href) return;
        const link = href.startsWith('http') ? href : `https://www.wi7imobiliaria.com.br${href.startsWith('/') ? '' : '/'}${href}`;

        const priceText = $(el).find('.price').text().trim() || $(el).find('strong').text().trim();
        const valor = parsePrice(priceText);

        let area = 0;
        let quartos = 0;
        let vagas = 0;
        let banheiros = 0;

        $(el).find('ul li').each((_idx, li) => {
            const txt = $(li).text().toLowerCase().trim();
            const val = parseInt(txt, 10) || 0;
            if (txt.includes('quarto') || txt.includes('dorm')) quartos = val;
            if (txt.includes('vaga') || txt.includes('garagem')) vagas = val;
            if (txt.includes('banheiro') || txt.includes('suite') || txt.includes('suíte')) banheiros = val;
            if (txt.includes('m²') || txt.includes('area')) {
                 const match = txt.match(/([0-9.,]+)/);
                 if (match) area = getFixValue(match[1]);
            }
        });

        const img = $(el).find('img').attr('src');
        const imagens = img ? [img] : [];

        if (valor > 0 || priceText.toLowerCase().includes('consulte')) {
            imoveis.push({
                site: 'wi7imobiliaria',
                titulo: title || 'Imóvel em Franca',
                descricao: title,
                imagens,
                endereco: title,
                valor,
                area,
                areaTotal: area,
                quartos,
                banheiros,
                vagas,
                precoPorMetro: area > 0 ? valor / area : 0,
                entrada: 0,
                link
            });
        }
    });

    return {
        imoveis,
        qtd: imoveis.length,
    };
  }
};

export default site;
