import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../../utils';
import { buildPortalSites } from './portal';

// Fastimob: listagem HTML unica (venda e locacao juntas) em /imoveis/pagina-N, 12 cartoes por pagina.
// O link carrega tudo: /imovel/<aluga|vende>/<uf>/<bairro>/<cidade>/<tipo>/<id>.
const PAGE_SIZE = 12;
const PATH = /\/imovel\/(aluga|vende)\/[a-z]{2}\/([^/]+)\/([^/]+)\/([^/]+)\/(\d+)\/?$/i;

export async function parseFastimob(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const aluguel = siteName.endsWith('Alugar');
  const imoveis: Imoveis[] = [];
  const pages = $('a[href*="imoveis/pagina-"]').map((_i, a) => parseInt(($(a).attr('href') || '').match(/pagina-(\d+)/)?.[1] ?? '0', 10)).get();

  $('.recent-properties-box').each((_i, el) => {
    const card = $(el);
    const link = card.find('a[href*="/imovel/"]').first().attr('href') || '';
    const match = link.match(PATH);
    // A listagem mistura finalidades e cidades vizinhas: cada site fica com a sua finalidade e com Franca.
    if (!match || (match[1].toLowerCase() === 'aluga') !== aluguel || normalizeText(match[3].replace(/-/g, ' ')) !== 'franca') return;

    const valor = getFixValue(card.find('.price').text().replace(/[^\d.,]/g, ''));
    if (valor <= 0) return;

    const bairro = cleanTitle(card.find('.location').text());
    const tipoTexto = match[4].replace(/-/g, ' ');
    const foto = card.find('img').first().attr('src') || '';
    const countOf = (word: RegExp): number =>
      parseInt(card.find('.facilities-list span').filter((_j, s) => word.test($(s).text())).first().text(), 10) || 0;

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto} - ${bairro}`),
      descricao: cleanTitle(card.find('img').first().attr('alt') || ''),
      imagens: foto ? [foto] : [],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area: 0,
      areaTotal: 0,
      quartos: countOf(/quarto/i),
      banheiros: countOf(/banheiro/i),
      vagas: countOf(/garagem|vaga/i),
      link: link.startsWith('http') ? link : `${host}${link}`,
      precoPorMetro: 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: match[5],
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  });

  return { imoveis, qtd: (pages.length > 0 ? Math.max(...pages) : 1) * PAGE_SIZE, html };
}

/** Par venda/aluguel de um site Fastimob; ambos varrem a mesma listagem e filtram a finalidade no parser. */
export const buildFastimobSites = (host: string, label: string): Site[] => buildPortalSites({
  host, label, pageSize: PAGE_SIZE, maxPages: 60, driver: 'axios', parser: parseFastimob,
  firstPageUrl: () => `${host}/imoveis`,
  pageUrl: (_tipo, page) => `${host}/imoveis/pagina-${page}`,
});
