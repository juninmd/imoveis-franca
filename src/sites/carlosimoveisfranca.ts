import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.carlosimoveisfranca.com.br/imoveis/a-venda/',
  name: 'carlosimoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.carlosimoveisfranca.com.br/imoveis/a-venda/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  let lastPage = 1;
  $('.pagination a').each((_, el) => {
    const pageNum = parseInt($(el).text());
    if (pageNum > lastPage) lastPage = pageNum;
  });

  let qtd = lastPage * 12; // safe estimate for pagination to run correctly

  $('.thumbnail').each((_, el) => {
    const $el = $(el);
    if ($el.find('.caption.detail').length === 0) return;

    const linkElem = $el.find('h1.title a');
    const linkAttr = linkElem.attr('href') || $el.find('a').first().attr('href');
    if (!linkAttr) return;

    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.carlosimoveisfranca.com.br${linkAttr}`;

    // Ignore rentals if any sneak in despite the URL
    if(!link.includes('/vende/')) return;

    const imgTitle = $el.find('img').first().attr('alt');
    const tituloText = imgTitle ? imgTitle.replace('VENDE - ', '').trim() : $el.find('h1.title a').text().trim() || $el.find('.tag-s a').text().trim();

    let bairro = $el.find('h3.location a').text().trim();
    if(bairro.toLowerCase().includes('franca')) {
         bairro = bairro.replace(/franca/i, '').replace(/ - /g, '').trim();
    }
    const titulo = `${tituloText} - ${bairro}`;

    const endereco = normalizeNeighborhoodName(bairro);

    let valor = 0;
    const valorText = $el.find('.price').text().trim();
    if (valorText && !valorText.toLowerCase().includes('consulte')) {
        const valorMatch = valorText.match(/R\$\s*([\d.,]+)/) || valorText.match(/([\d.,]+)/);
        if (valorMatch) {
            let numStr = valorMatch[1].replace(/\./g, '');
            if(numStr.includes(',')) {
                numStr = numStr.replace(',', '.');
            }
            valor = parseFloat(numStr);
            // heuristic: if price is very low (e.g. 680 meaning 680,000), multiply by 1000
            if (valor > 0 && valor < 5000 && !link.includes('aluga')) {
                valor = valor * 1000;
            }
        }
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $el.find('.facilities-list li').each((_, det) => {
        const text = $(det).text().toLowerCase();
        if (text.includes('quarto') || text.includes('dorm')) {
            const quartosMatch = text.match(/(\d+)/);
            if (quartosMatch) quartos = parseInt(quartosMatch[1]);
        }
        if (text.includes('banheiro') || text.includes('suite') || text.includes('suíte')) {
            const banheirosMatch = text.match(/(\d+)/);
            if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);
        }
        if (text.includes('vaga') || text.includes('garagem') || text.includes('garagem')) {
            const vagasMatch = text.match(/(\d+)/);
            if (vagasMatch) vagas = parseInt(vagasMatch[1]);
        }
        if (text.includes('área') || text.includes('area') || text.includes('m²')) {
             const areaMatch = text.match(/([\d.,]+)/);
             if (areaMatch) {
                 area = parseFloat(areaMatch[1].replace(/\./g, '').replace(',', '.'));
             }
        }
    });

    const imgAttr = $el.find('img.img-responsive').attr('src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.carlosimoveisfranca.com.br${imgAttr}`] : [];

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
            site: 'carlosimoveisfranca.com.br',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}