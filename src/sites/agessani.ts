import { Site } from '../types';
import * as cheerio from 'cheerio';
import { getFixValue } from '../utils';

const site: Site = {
  name: 'agessani',
  url: 'https://www.agessani.com',
  driver: 'axios',
  enabled: true,
  itemsPerPage: 15,
  getPaginateParams: (page: number) => {
    return {
      path: `/imovel/?finalidade=venda&pag=${page}`,
    };
  },
  adapter: async (html: string) => {
    const $ = cheerio.load(html);
    const imoveis: any[] = [];

    const parsePrice = (priceStr: string) => {
        const cleaned = priceStr.replace(/R\$/gi, '').replace(/\./g, '').replace(/,/g, '.').trim();
        return parseFloat(cleaned) || 0;
    };

    $('.item-lista').each((_i, el) => {
        const linkElem = $(el).find('a');
        const href = linkElem.attr('href');
        if (!href) return;
        const link = href.startsWith('http') ? href : `https://www.agessani.com${href.startsWith('/') ? '' : '/'}${href}`;

        const text = $(el).text().replace(/\s+/g, ' ');
        const priceMatches = text.match(/R\$\s*[0-9.]+,,?\d{0,2}/g) || text.match(/R\$\s*[0-9.]+,?\d{2}/g);
        let valor = 0;
        if (priceMatches && priceMatches.length > 0) {
            valor = parsePrice(priceMatches[priceMatches.length - 1]);
        }

        let area = 0;
        const areaMatch = text.match(/([0-9.]+)\s*m²/i);
        if (areaMatch) {
            area = getFixValue(areaMatch[1]);
        }

        let titulo = '';
        const titleMatch = text.match(/^(.*?)\s*Ref:/);
        if (titleMatch) {
            titulo = titleMatch[1].trim();
        } else {
            titulo = $(el).find('h2').text().trim() || 'Imóvel';
        }

        let quartos = 0;
        let vagas = 0;
        let banheiros = 0;

        $(el).find('.info-2 span').each((_idx, span) => {
            const spanHtml = $(span).html() || '';
            const val = parseInt($(span).text().trim(), 10) || 0;
            if (spanHtml.includes('bed') || spanHtml.includes('quarto') || spanHtml.includes('dormitorio')) {
                quartos = val;
            } else if (spanHtml.includes('car') || spanHtml.includes('vaga') || spanHtml.includes('garagem')) {
                vagas = val;
            } else if (spanHtml.includes('bath') || spanHtml.includes('banheiro') || spanHtml.includes('suite')) {
                banheiros = val;
            }
        });

        const img = $(el).find('img').attr('src') || $(el).find('.img-item-lista').attr('style')?.match(/url\(['"]?(.*?)['"]?\)/)?.[1];
        const imagens = img ? [img] : [];

        if (valor > 0) {
            imoveis.push({
                site: 'agessani',
                titulo,
                descricao: titulo,
                imagens,
                endereco: titulo,
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
  },
};

export default site;
