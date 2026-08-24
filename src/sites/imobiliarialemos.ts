import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.imobiliarialemos.com.br/imoveis/a-venda/franca',
  name: 'imobiliarialemos.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.imobiliarialemos.com.br/imoveis/a-venda/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const imoveis: Imovel[] = [];

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*imóveis/i) || bodyText.match(/Encontrados\s*(\d+)/i) || bodyText.match(/(\d+)\s*resultados/i);
  let qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  // Lemos uses elements with class property-item or just specific links
  const items = $('a[href*="/comprar/"]');

  items.each((_i, el) => {
    const $el = $(el);
    const linkAttr = $el.attr('href');
    if (!linkAttr || !linkAttr.includes('/comprar/')) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.imobiliarialemos.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    const text = $el.text().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 10) return;

    let titulo = $el.find('h2, h3, h4').first().text().trim();
    if(!titulo) titulo = $el.attr('title') || $el.find('img').first().attr('alt') || 'Imóvel em Franca';

    const parts = linkAttr.split('/');
    let bairroRaw = parts.length > 4 ? parts[4] : '';
    bairroRaw = bairroRaw.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const endereco = normalizeNeighborhoodName(bairroRaw || 'Franca');

    // Trying to extract from the combined text. Lemos text looks like: "Casa a Venda no Jardim Paulistano Franca - SP ... R$ 680.000 ..."
    const valorMatch = text.match(/R\$\s*([\d.,]+)/);
    const valor = valorMatch ? parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.')) : 0;

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    const areaMatch = text.match(/([\d.,]+)\s*m²/i);
    if(areaMatch) area = parseFloat(areaMatch[1].replace(',', '.'));

    const quartosMatch = text.match(/(\d+)\s*(quartos?|dorm)/i);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = text.match(/(\d+)\s*(banheiros?|suítes?|st)/i);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = text.match(/(\d+)\s*(vagas?|garagem)/i);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    const imgAttr = $el.find('img').first().attr('src') || $el.find('img').first().attr('data-src');
    const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.imobiliarialemos.com.br${imgAttr.startsWith('/') ? '' : '/'}${imgAttr}`] : [];

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
            site: 'imobiliarialemos.com.br',
            entrada: valor * 0.2
        });
    }
  });

  if (qtd === 0 && imoveis.length > 0) {
      qtd = imoveis.length;
  }

  return { imoveis, qtd, html };
}
