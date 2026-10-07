import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.agessani.com/imovel/venda/',
  name: 'agessani.com',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.agessani.com/imovel/venda/?pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  // A paginação mostra só as primeiras páginas e "..." para o resto; usamos o maior número
  // visível (ou 10 páginas quando há reticências) e páginas vazias simplesmente não somam nada.
  const pages = $('.lista_imoveis_paginacao a').map((_i, el) => parseInt($(el).text(), 10)).get().filter(n => !isNaN(n));
  const hasMore = $('.lista_imoveis_paginacao a').filter((_i, el) => $(el).text().trim() === '...').length > 0;
  const maxPage = hasMore ? 10 : (pages.length > 0 ? Math.max(...pages) : 1);

  // Os <a> internos (tooltips) aninhados no <a> do card fazem o parser quebrar o link externo;
  // por isso o card é o .item-lista e o link vem do botão "Ver Detalhes".
  $('.item-lista').each((_i, el) => {
    const btn = $(el).find('a.btver').first();
    let link = btn.attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://www.agessani.com${link}`;

    const titulo = (btn.attr('title') || '').trim();
    const loc = $(el).find('h3').first().text().trim();
    const endereco = normalizeNeighborhoodName(loc.split(',')[0] || 'Franca');
    const valor = getFixValue($(el).find('ul li').first().text().replace(/R\$/g, '').replace(/\./g, '').trim());

    const tooltip = (name: string) => {
      const txt = $(el).find(`a[data-tooltip="${name}"]`).first().text();
      const m = txt.match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    };

    const area = tooltip('Área');
    const img = $(el).find('.img-item-lista img').attr('src');

    if (valor > 0) {
      imoveis.push({
        titulo: titulo || `Imóvel em ${endereco}`,
        descricao: '',
        imagens: img ? [img.startsWith('http') ? img : `https://www.agessani.com${img}`] : [],
        endereco,
        valor,
        area,
        areaTotal: area,
        quartos: tooltip('Dormitórios'),
        link,
        banheiros: tooltip('Banheiros'),
        vagas: tooltip('Vagas'),
        precoPorMetro: area > 0 ? Math.round(valor / area) : 0,
        site: 'agessani.com',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? maxPage * 15 : 0, html };
}
