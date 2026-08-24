import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.pucciimobiliaria.com.br/venda/imoveis/todas-as-cidades/todos-os-bairros/0-quartos/0-suite-ou-mais/0-vaga/0-banheiro-ou-mais/todos-os-condominios?valorminimo=0&valormaximo=0&pagina=1',
  name: 'pucciimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.pucciimobiliaria.com.br/venda/imoveis/todas-as-cidades/todos-os-bairros/0-quartos/0-suite-ou-mais/0-vaga/0-banheiro-ou-mais/todos-os-condominios?valorminimo=0&valormaximo=0&pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*Imóveis Encontrados/i);
  let qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  if(qtd === 0) {
      const headingNum = $('#numero-imoveis').text().trim();
      const hNum = headingNum.match(/(\d+)/);
      if(hNum) {
          qtd = Number(hNum[1]);
      }
  }

  const items = $('.property-box, .property, div[class*="imovel"], .card');

  items.each((_i, el) => {
    const $el = $(el);
    const linkAttr = $el.find('a[href*="/imovel/"], a.property-img').first().attr('href') || $el.closest('a').attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.pucciimobiliaria.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    const titulo = $el.find('h3, h4, .title').first().text().trim() || $el.find('a[title]').attr('title') || '';
    if (!titulo) return;

    let endereco = titulo;
    if (titulo.includes('-')) {
      endereco = titulo.split('-')[1].trim();
    }
    endereco = normalizeNeighborhoodName(endereco);

    const valorText = $el.find('.price, b:contains("R$"), span:contains("R$")').text().trim() || $el.text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    const details = $el.text().toLowerCase();

    const areaMatch = details.match(/(\d+)\s*m²/i) || details.match(/(\d+)\s*m&sup2;/i);
    if (areaMatch) area = parseFloat(areaMatch[1]);

    const quartosMatch = details.match(/(\d+)\s*quarto/i) || details.match(/(\d+)\s*dorm/i);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = details.match(/(\d+)\s*banh/i) || details.match(/(\d+)\s*suite/i) || details.match(/(\d+)\s*suíte/i);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = details.match(/(\d+)\s*vaga/i) || details.match(/(\d+)\s*garagem/i);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    let imgAttr = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
    let imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.pucciimobiliaria.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`] : [];

    if (imgAttr && imgAttr.includes('blank')) {
        imgAttr = $el.find('img').first().attr('data-src');
        imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.pucciimobiliaria.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`] : [];
    }

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
            site: 'pucciimobiliaria.com.br',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}
