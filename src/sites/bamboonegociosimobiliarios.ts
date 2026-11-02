import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName, normalizeText } from '../utils';

const HOST = 'https://www.bamboonegociosimobiliarios.com.br';
const NAME = 'bamboonegociosimobiliarios.com.br - Comprar';
const PAGE_SIZE = 10;
const FILTRO = encodeURIComponent("where tipo like '%venda%'  and liberar = 1").replace(/%20/g, '+').replace(/'/g, '%27');

// Imoflex (ISO-8859-1), so venda. A pagina vem de "Submit=N" (PagAtual fixo em 2); o catalogo cobre
// cidades vizinhas e o local de cada cartao e "Tipo - Cidade".
export async function parseBamboo(payload: unknown): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const html = typeof payload === 'string' ? payload : Buffer.from(payload as ArrayBuffer).toString('latin1');
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];
  const total = parseInt(($('body').text().match(/(\d+)\s+im[oó]veis/i) || [])[1] ?? '0', 10);

  $('.row.center-content').each((_i, el) => {
    const card = $(el);
    const heading = cleanTitle(card.find('h4').first().text());
    if (!heading || card.find('.row.center-content').length) return;
    const [tipoTexto, cidade = ''] = heading.split(/\s+-\s+/);
    const path = card.find('a[href^="/detalhes-do-imovel"]').first().attr('href') || '';
    const valor = getFixValue((card.find('p').filter((_j, p) => /Venda\s*R\$/i.test($(p).text())).first().text().match(/R\$\s*([\d.,]+)/) || [])[1] ?? '0');
    if (!path || valor <= 0 || normalizeText(cidade) !== 'franca') return;

    const counts = card.find('p.space20 font').text();
    const metric = (label: string): number => parseInt((counts.match(new RegExp(`(\\d+)\\s*${label}`, 'i')) || [])[1] ?? '0', 10) || 0;
    const bairro = card.find('h3').first().text();
    const descricao = cleanTitle(card.find('p').filter((_j, p) => !$(p).attr('class') && $(p).text().length > 20).first().text());
    const area = getFixValue((descricao.match(/([\d.,]+)\s*m[²2]/i) || [])[1] ?? '0');

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto} - ${bairro}`),
      descricao,
      imagens: card.find('figure img').map((_j, img) => $(img).attr('src') || '').get().filter(Boolean),
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: area,
      quartos: metric('Dorm'),
      banheiros: metric('Banh'),
      vagas: metric('Vaga'),
      link: `${HOST}${path}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: NAME,
      entrada: valor * 0.20,
      codigo: (card.text().match(/C[oó]digo\s+([A-Z0-9]+)/i) || [])[1],
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  });

  return { imoveis, qtd: total || imoveis.length, html };
}

const pageUrl = (page: number): string => `${HOST}/resultado?selfiltrop=10&filtro=${FILTRO}&PagAtual=2&Submit=${page}`;

export default {
  enabled: true,
  tipo: 'venda',
  url: pageUrl(1),
  name: NAME,
  driver: 'axios_rest',
  method: 'GET',
  itemsPerPage: PAGE_SIZE,
  maxPages: 5,
  axiosConfig: { responseType: 'arraybuffer' },
  params: [],
  getPaginateParams: (page: number) => ({ url: pageUrl(page) }),
  adapter: parseBamboo,
} as unknown as Site;
