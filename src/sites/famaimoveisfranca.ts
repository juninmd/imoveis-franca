import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.famaimoveisfranca.com.br/imovel/?finalidade=venda',
  name: 'famaimoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.famaimoveisfranca.com.br/imovel/?finalidade=venda&pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const h1Text = $('h1').text();
  const qtdMatch = h1Text.match(/(\d+)\s*Imóveis/i) || $('body').text().match(/(\d+)\s*imóveis/i);
  let qtd = qtdMatch ? parseInt(qtdMatch[1]) : 0;

  $('.imovelcard').each((_, el) => {
    const $el = $(el);
    const linkElem = $el.find('a.imovelcard__img');
    const linkAttr = linkElem.attr('href');
    if (!linkAttr) return;

    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.famaimoveisfranca.com.br${linkAttr}`;
    const titulo = linkElem.attr('title') || $el.find('.imovelcard__info__tag').text() + ' - ' + $el.find('.imovelcard__info__local').text();

    let bairro = $el.find('.imovelcard__info__local').text().replace(/,.*$/, '').trim();
    if (bairro.toLowerCase().includes('franca')) {
        bairro = bairro.replace(/franca/i, '').replace(/ - /g, '').trim();
    }
    const endereco = normalizeNeighborhoodName(bairro);

    let valor = 0;
    const valorText = $el.find('.imovelcard__valor__valor').text().trim();
    if (valorText && !valorText.toLowerCase().includes('consulte')) {
        const valorMatch = valorText.match(/R\$\s*([\d.,]+)/);
        if (valorMatch) {
            valor = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
        }
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $el.find('.imovelcard__info__feature p').each((_, det) => {
        const text = $(det).text().toLowerCase();
        if (text.includes('m²') || text.includes('área') || text.includes('terreno')) {
            const areaMatch = text.match(/([\d.,]+)\s*m/);
            if (areaMatch) {
               const parsedArea = parseFloat(areaMatch[1].replace(/\./g, '').replace(',', '.'));
               if(parsedArea > area) area = parsedArea; // Sometimes multiple areas, grab biggest or first
            }
        }
        if (text.includes('quarto') || text.includes('dorm')) {
            const quartosMatch = text.match(/(\d+)/);
            if (quartosMatch) quartos = parseInt(quartosMatch[1]);
        }
        if (text.includes('banheiro') || text.includes('suite') || text.includes('suíte')) {
            const banheirosMatch = text.match(/(\d+)/);
            if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);
        }
        if (text.includes('vaga') || text.includes('garagem')) {
            const vagasMatch = text.match(/(\d+)/);
            if (vagasMatch) vagas = parseInt(vagasMatch[1]);
        }
    });

    const imgAttr = linkElem.find('img').attr('src') || linkElem.find('img').attr('data-src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.famaimoveisfranca.com.br${imgAttr}`] : [];

    if (valor > 0 && link && !imoveis.find(i => i.link === link)) {
        imoveis.push({
            titulo,
            descricao: '',
            imagens,
            endereco,
            valor,
            area,
            areaTotal: area,
            quartos,
            link,
            banheiros,
            vagas,
            precoPorMetro: area > 0 ? valor / area : 0,
            site: 'famaimoveisfranca.com.br',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}