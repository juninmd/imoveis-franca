import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export const adapter = async (html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> => {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const cards = $('.search-detail-right-img-area').parent();
  // O ultimo link e "Proximo" (NaN): a ultima pagina e o maior numero entre os links.
  const lastPage = Math.max(0, ...$('.search-pageing.pagination a').map((_i, el) => parseInt($(el).text(), 10) || 0).get());
  const qtd = lastPage * 20 || cards.length;

  cards.each((_, el) => {
    try {
      const linkEl = $(el).find('img.clickable_prop_more_info');
      const href = linkEl.attr('rel') || $(el).find('a').attr('href');

      if (!href) return;

      const fullLink = href.startsWith('http') ? href : `https://www.francaimoveis.net${href}`;

      const content = $(el).find('.project-detail-right-block-content');
      const anchors = content.find('a');

      const tipo = anchors.eq(0).text().trim();

      const specs = anchors.eq(2).text().trim();
      const bairro = anchors.eq(3).text().trim();

      const titulo = `${tipo} - ${bairro}`;

      const valorRaw = content.find('.price').text();
      const valor = parseFloat(valorRaw.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;

      const endereco = normalizeNeighborhoodName(bairro);

      const imgAttr = linkEl.attr('src');
      const img = imgAttr ? (imgAttr.startsWith('http') ? imgAttr : `https://www.francaimoveis.net${imgAttr}`) : '';

      let quartos = 0;
      let banheiros = 0;
      let vagas = 0;

      const dormMatch = specs.match(/(\d+)\s*(?:Dorm|Dorms|Quarto|Quartos)/i);
      if (dormMatch) quartos = parseInt(dormMatch[1]);

      const suiteMatch = specs.match(/(\d+)\s*Suite/i);
      if (suiteMatch) banheiros = parseInt(suiteMatch[1]);

      const vagaMatch = specs.match(/(\d+)\s*Vaga/i);
      if (vagaMatch) vagas = parseInt(vagaMatch[1]);

      if (titulo || valor > 0 || img) {
         imoveis.push({
            site: 'francaimoveis.net',
            titulo: titulo,
            descricao: specs,
            imagens: [img].filter(Boolean),
            endereco: endereco,
            valor,
            area: 0,
            areaTotal: 0,
            quartos,
            banheiros,
            vagas,
            link: fullLink,
            precoPorMetro: 0,
            entrada: valor * 0.2
        });
      }
    } catch (e) {
      console.warn("Error parsing card", e);
    }
  });

  return { imoveis, qtd, html };
};

const URL = 'https://www.francaimoveis.net/imoveis/a-venda/franca';

// A paginacao e um POST de formulario (page=N); com GET toda pagina devolvia a primeira.
const francaimoveis: Site = {
  driver: 'axios_rest',
  method: 'POST',
  enabled: true,
  tipo: 'venda',
  name: 'francaimoveis.net',
  url: URL,
  itemsPerPage: 20,
  payload: { page: 1, order: 'destaque' },
  axiosConfig: { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124 Safari/537.36' } },
  adapter,
  translateParams: {
    currentPage: 'page',
    maxPrice: undefined,
    minPrice: undefined,
  },
  getPaginateParams: (page: number) => ({ url: URL, payload: { page, order: 'destaque' } }),
};

export default francaimoveis;
