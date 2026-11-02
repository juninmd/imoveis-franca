import * as cheerio from 'cheerio';
import { Imoveis } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';
import { buildPortalSites } from './platforms/portal';

const HOST = 'https://www.jedisonimoveis.com.br';
const PAGE_SIZE = 12;
const MIN_VALID_PRICE = 100;
const PATH = /^\/(comprar|alugar)\/sp\/franca\/([^/]+)\/([^/]+)\/(\d+)\/?$/;

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

// Tokko (template "resultado_lista"), renderizado no servidor: /comprar e /alugar paginam em /pagina-N/.
// Alem do fim da lista a pagina repete 2 cartoes de destaque, entao o total vem dos links de paginacao.
export async function parseJedison(html: string, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const aluguel = siteName.endsWith('Alugar');
  const imoveis: Imoveis[] = [];
  const pages = $('a[href*="pagina-"]').map((_i, a) => parseInt(($(a).attr('href') || '').match(/pagina-(\d+)/)?.[1] ?? '0', 10)).get();

  $('.resultado_lista').each((_i, el) => {
    const card = $(el);
    const path = card.find('a[href*="/sp/franca/"]').first().attr('href') || '';
    const match = path.match(PATH);
    if (!match || (match[1] === 'alugar') !== aluguel) return;

    // A pagina de venda mistura cartoes de locacao: vale o rotulo do bloco de valor.
    const valor = toNumber(card.find('.valor h5').first().text());
    // "R$ 1,00" e o placeholder de "sob consulta".
    if (valor < MIN_VALID_PRICE) return;

    const detalhes = card.find('.detalhes').text().replace(/\s+/g, ' ');
    const count = (word: RegExp): number => parseInt((detalhes.match(word) || [])[1] ?? '0', 10) || 0;
    // Area "1,00" e placeholder; a construida tem preferencia sobre a total.
    const areaOf = (suffix: RegExp): number => { const n = toNumber((detalhes.match(suffix) || [])[1]); return n > 1 ? n : 0; };
    const area = areaOf(/([\d.,]+)\s*m² constru/i) || areaOf(/([\d.,]+)\s*m² total/i);
    const titulo = cleanTitle(card.find('h3.tipo').text());
    const bairro = card.find('h4.localizacao span').text().split(' - ')[0];
    const imagens = card.find('[data-img]').map((_j, d) => $(d).attr('data-img') || '').get().filter(Boolean);

    imoveis.push({
      titulo,
      descricao: cleanTitle(card.find('.descricao').text()),
      imagens: [...new Set(imagens)],
      endereco: normalizeNeighborhoodName(bairro || match[2].replace(/-/g, ' ')),
      valor,
      area,
      areaTotal: area,
      quartos: count(/(\d+)\s*dormit/i),
      banheiros: count(/(\d+)\s*banh/i),
      vagas: count(/(\d+)\s*vaga/i),
      link: `${host}${path}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: cleanTitle(card.find('.referencia').text()) || undefined,
      tipoImovel: inferTipoImovel(match[3].replace(/-/g, ' ')) || undefined,
    });
  });

  const lastPage = pages.length > 0 ? Math.max(...pages) : 1;
  return { imoveis, qtd: lastPage * PAGE_SIZE, html };
}

const base = (tipo: string) => `${HOST}/${tipo === 'venda' ? 'comprar' : 'alugar'}`;

export default buildPortalSites({
  host: HOST,
  label: 'jedisonimoveis.com.br',
  pageSize: PAGE_SIZE,
  maxPages: 60,
  driver: 'axios',
  parser: parseJedison,
  firstPageUrl: base,
  pageUrl: (tipo, page) => `${base(tipo)}/pagina-${page}/`,
});
