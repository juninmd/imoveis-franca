import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://imobiliarialadonni.com.br/imovel/?finalidade=venda',
  name: 'imobiliarialadonni.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://imobiliarialadonni.com.br/imovel/?finalidade=venda&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const items = $('.item-lista, .bximovel');

  items.each((_i, el) => {
    const $el = $(el);
    const linkAttr = $el.find('a[href*="/imovel/"]').first().attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://imobiliarialadonni.com.br${linkAttr}`;

    const titulo = $el.find('h3, .titulo-detalhes-imovel').text().trim() || $el.find('a[title]').attr('title') || '';

    let endereco = titulo;
    if (titulo.includes(', em ')) {
      endereco = titulo.split(', em ')[1].trim();
    }
    endereco = normalizeNeighborhoodName(endereco);

    const valorText = $el.find('b:contains("R$"), strong:contains("R$"), .valor:contains("R$"), span:contains("R$"), li:contains("R$")').first().text().trim() || $el.find('ul').text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    const details = $el.text().toLowerCase();

    const areaMatch = details.match(/(\d+)\s*m²/i) || details.match(/(\d+)\s*m&sup2;/i);
    if (areaMatch) area = parseFloat(areaMatch[1]);

    const quartosMatch = details.match(/(\d+)\s*dorm/i) || details.match(/(\d+)\s*quarto/i);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = details.match(/(\d+)\s*banh/i) || details.match(/(\d+)\s*wc/i) || details.match(/(\d+)\s*suíte/i);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = details.match(/(\d+)\s*vaga/i);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    const imgAttr = $el.find('img').first().attr('src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://imobiliarialadonni.com.br${imgAttr}`] : [];

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
            site: 'imobiliarialadonni.com.br',
            entrada: valor * 0.2
        });
    }
  });

  // Calculate qtd (using some estimation if exact count isn't readily available)
  const qtdTextMatch = html.match(/(\d+)\s*Imóveis/i) || html.match(/(\d+)\s*imóveis encontrados/i);
  let qtd = imoveis.length;

  if (qtdTextMatch) {
     qtd = parseInt(qtdTextMatch[1]);
  } else {
     const pagesCount = $('.lipagina-btn-paginacao').length;
     if (pagesCount > 0) {
        qtd = pagesCount * 12; // Approximation
     }
  }

  return { imoveis, qtd, html };
}
