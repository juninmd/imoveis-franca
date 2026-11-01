import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../utils';

const HOST = 'https://www.jresendeimoveis.com.br';
const LABEL = 'jresendeimoveis.com.br';

type Tipo = 'venda' | 'aluguel';

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));

// Imobiliaria de Ribeirao Preto com carteira em Franca (plataforma Kurole, ISO-8859-1). A listagem
// de Franca cabe numa pagina; cartoes de venda+locacao trazem "R$ x L" e "R$ y V" lado a lado.
export async function parseJResende(payload: unknown, siteName: string, tipo: Tipo): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const html = typeof payload === 'string' ? payload : Buffer.from(payload as ArrayBuffer).toString('latin1');
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  $('.lista-imoveis .card-imo').each((_i, el) => {
    const card = $(el);
    const path = card.find('a.carousel-cell').first().attr('href') || '';
    if (!/^\/(?:alugar|comprar)\/FRANCA\//i.test(path)) return;

    // Cada preco termina com a letra da finalidade (L ou V); o preco antigo vem riscado em <del>.
    card.find('.card-valores del').remove();
    // Sem \b: o texto dos dois precos pode vir colado ("...00 LR$ 549...").
    const prices = [...card.find('.card-valores').text().matchAll(/R\$\s*([\d.,]+)\s*([LV])/g)];
    const wanted = prices.find(p => p[2] === (tipo === 'aluguel' ? 'L' : 'V'));
    const valor = toNumber(wanted?.[1]);
    if (valor <= 0) return;

    const titulo = cleanTitle(card.find('h2.card-titulo').first().text());
    const descricao = cleanTitle(card.find('.card-texto').text());
    const bairro = card.find('.card-bairro-cidade-texto').text().split(' - ')[0];
    const countOf = (selector: string): number => parseInt(card.find(`${selector} span`).last().text(), 10) || 0;
    const area = toNumber((descricao.match(/([\d.,]+)\s*m[²2]/i) || [])[1]);
    const tipoPath = path.split('/')[3] ?? '';

    imoveis.push({
      titulo,
      descricao,
      imagens: card.find('img[data-flickity-lazyload-src]').map((_j, img) => $(img).attr('data-flickity-lazyload-src') || '').get().filter(Boolean),
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: area,
      quartos: countOf('.dorm-ico'),
      banheiros: countOf('.banh-ico'),
      vagas: countOf('.gar-ico'),
      link: `${HOST}${path}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: card.find('.cod-imovel strong').first().text() || undefined,
      tipoImovel: inferTipoImovel(`${tipoPath} ${titulo}`) || undefined,
    });
  });

  return { imoveis, qtd: imoveis.length, html };
}

const buildSite = (tipo: Tipo): Site => {
  const name = `${LABEL} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  const url = `${HOST}/${tipo === 'venda' ? 'comprar' : 'alugar'}/FRANCA`;
  return {
    enabled: true, tipo, url, name, driver: 'axios_rest', method: 'GET', itemsPerPage: 100,
    axiosConfig: { responseType: 'arraybuffer' },
    params: [],
    getPaginateParams: () => ({ url }),
    adapter: (payload: unknown) => parseJResende(payload, name, tipo),
  } as unknown as Site;
};

export default [buildSite('venda'), buildSite('aluguel')];
