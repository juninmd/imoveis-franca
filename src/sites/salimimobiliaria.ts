import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.salimimobiliaria.com.br/venda/sao-paulo/franca/',
  name: 'salimimobiliaria.com.br',
  driver: 'axios',
  itemsPerPage: 12, // the site returns 12 per page by default
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.salimimobiliaria.com.br/venda/sao-paulo/franca/?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*imóveis\s*encontrados/i) || bodyText.match(/(\d+)\s*resultados/i);
  let qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const items = $('.imovel-card, .card-imovel, .col-md-4').filter((_, el) => {
      const classNames = $(el).attr('class') || '';
      return classNames.includes('imovel') || classNames.includes('col-md-4');
  });

  items.each((_i, el) => {
    const $el = $(el);
    const linkAttr = $el.find('a[href*="/imovel/"], a.imovel-link').first().attr('href') || $el.closest('a').attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.salimimobiliaria.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    const titulo = $el.find('h2, h3, .imovel-title, .titulo').first().text().trim();
    if (!titulo) return;

    let endereco = titulo;
    const enderecoElem = $el.find('.imovel-address, .endereco, .bairro').first().text().trim();
    if (enderecoElem) {
        endereco = enderecoElem;
    }
    endereco = normalizeNeighborhoodName(endereco.replace('Franca - ', '').replace(' - Franca', ''));

    const valorText = $el.find('.imovel-price, .preco, .valor').text().trim() || $el.text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    const details = $el.text().toLowerCase();

    const areaMatch = details.match(/(\d+)\s*m²/i);
    if (areaMatch) area = parseFloat(areaMatch[1]);

    const quartosMatch = details.match(/(\d+)\s*dorm/i) || details.match(/(\d+)\s*quarto/i);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = details.match(/(\d+)\s*banh/i) || details.match(/(\d+)\s*suíte/i);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = details.match(/(\d+)\s*vaga/i);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    const imgAttr = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.salimimobiliaria.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`] : [];

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
            site: 'salimimobiliaria.com.br',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}
