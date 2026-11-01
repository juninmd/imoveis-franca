import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../../types';
import { cleanTitle, getFixValue, inferTipoImovel, normalizeNeighborhoodName } from '../../utils';

const PAGE_SIZE = 30;

type Tipo = 'venda' | 'aluguel';

const toNumber = (text = ''): number => getFixValue(text.replace(/[^\d.,]/g, ''));
const countBefore = (text: string, word: RegExp): number => parseInt((text.match(word) || [])[1] ?? '', 10) || 0;

// O site serve ISO-8859-1 sem declarar no corpo; o driver axios decodificaria como UTF-8 e
// estragaria os acentos, entao o corpo vem como bytes e e decodificado aqui.
export async function parseGridList(payload: unknown, siteName: string, host: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const html = typeof payload === 'string' ? payload : Buffer.from(payload as ArrayBuffer).toString('latin1');
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  // O rodape de paginacao mostra a janela de paginas; o maior numero e o total de paginas.
  const pages = $('a[href*="pag="]').map((_i, a) => parseInt(($(a).attr('href') || '').match(/pag=(\d+)/)?.[1] ?? '0', 10)).get();
  const qtdPages = pages.length > 0 ? Math.max(...pages) : 1;

  $('.lista-imoveis dl.gridTypeList').each((_i, el) => {
    const card = $(el);
    const path = card.find('dd.det-lista a').first().attr('href') || '';
    const valor = toNumber(card.find('.valorImovel b').first().text());
    // Imobiliarias da regiao tambem listam cidades vizinhas: o .loc traz "bairro / Cidade - UF".
    if (!path || valor <= 0 || !/franca\s*-\s*sp/i.test(card.find('.loc').text())) return;

    const tipoTexto = cleanTitle(card.find('dd.det-lista strong').first().text());
    const bairro = card.find('.loc b').first().text();
    const descricao = cleanTitle(card.find('.descr').text());
    const area = toNumber((descricao.match(/([\d.,]+)\s*m²/) || [])[1]);
    const thumb = card.find('dd.foto-lista img').attr('data-src') || '';

    imoveis.push({
      titulo: cleanTitle(`${tipoTexto} - ${bairro}`.replace(/^ - | - $/g, '')),
      descricao,
      // A listagem so tem a miniatura; a versao "big-" do mesmo arquivo e a foto cheia.
      imagens: thumb ? [`${host}${thumb.replace('/thumb-', '/big-')}`] : [],
      endereco: normalizeNeighborhoodName(bairro),
      valor,
      area,
      areaTotal: area,
      quartos: countBefore(descricao, /(\d+)\s*(?:dormit|quarto|su[ií]te)/i),
      banheiros: countBefore(descricao, /(\d+)\s*banheiro/i),
      vagas: countBefore(descricao, /(\d+)\s*vagas?/i),
      link: `${host}${path}`,
      precoPorMetro: area > 0 ? valor / area : 0,
      site: siteName,
      entrada: valor * 0.20,
      codigo: card.find('.cr b').first().text() || undefined,
      tipoImovel: inferTipoImovel(tipoTexto) || undefined,
    });
  });

  return { imoveis, qtd: qtdPages * PAGE_SIZE, html };
}

export const buildGridListSites = (host: string, label: string): Site[] => (['venda', 'aluguel'] as Tipo[]).map(tipo => {
  const name = `${label} - ${tipo === 'venda' ? 'Comprar' : 'Alugar'}`;
  const url = `${host}/secao/${tipo}`;
  return {
    enabled: true, tipo, url, name, driver: 'axios_rest', method: 'GET', itemsPerPage: PAGE_SIZE,
    axiosConfig: { responseType: 'arraybuffer' },
    params: [],
    getPaginateParams: (page: number) => ({ url: page > 1 ? `${url}?pag=${page}` : url }),
    adapter: (payload: unknown) => parseGridList(payload, name, host),
  } as unknown as Site;
});
