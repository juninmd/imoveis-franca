import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://matriz.site/busca?finalidade=Venda',
  name: 'matriz.site',
  driver: 'axios',
  itemsPerPage: 20,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://matriz.site/busca?finalidade=Venda&page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*imóveis/i) || bodyText.match(/(\d+)\s*resultados/i);
  let qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  // Also parse html cards if data isn't in script tags
  const items = $('.property-card, [class*="group hover:bg-background"]');

  items.each((_i, el) => {
    const $el = $(el);
    const linkAttr = $el.find('a[href*="/imovel/"]').first().attr('href') || $el.closest('a').attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://matriz.site${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    let titulo = $el.find('h3, h4, .font-semibold').first().text().trim();
    if(!titulo) titulo = $el.find('.truncate').first().text().trim();

    if (!titulo) return;

    let endereco = titulo;
    const enderecoElem = $el.find('div:contains("Bairro")').next().text().trim() || $el.find('.text-secondary.uppercase:contains("Bairro")').next().text().trim();
    if (enderecoElem) {
        endereco = enderecoElem;
    }
    endereco = normalizeNeighborhoodName(endereco);

    const valorText = $el.find('b:contains("R$"), span:contains("R$"), div:contains("R$")').text().trim() || $el.text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    const areaElem = $el.find('span:contains("m²")').first().text().trim();
    if (areaElem) {
        area = parseFloat(areaElem.replace('m²', '').trim());
    }

    const details = $el.text().toLowerCase();

    if (!area) {
        const areaMatch = details.match(/(\d+)\s*m²/i);
        if (areaMatch) area = parseFloat(areaMatch[1]);
    }

    const quartosMatch = details.match(/(\d+)\s*qt/i) || details.match(/(\d+)\s*dorm/i);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = details.match(/(\d+)\s*st/i) || details.match(/(\d+)\s*banh/i);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = details.match(/(\d+)\s*vaga/i);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    const imgAttr = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://matriz.site${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`] : [];

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
            site: 'matriz.site',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}
