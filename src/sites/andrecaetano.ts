import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://andrecaetano.com.br/secao/venda',
  name: 'andrecaetano.com.br',
  driver: 'axios',
  itemsPerPage: 30,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://andrecaetano.com.br/secao/venda?pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];

  // Use binary to utf8 to avoid corruption
  const $ = cheerio.load(Buffer.from(html, 'binary').toString('utf8'));

  let qtd = 0;
  const resultadosTexto = $('.pagesNav').text();
  if (resultadosTexto) {
    const m = resultadosTexto.match(/des*(d+)s*resultados/);
    if (m && m[1]) qtd = parseInt(m[1]);
  }
  if (!qtd) qtd = 1000;

  $('.gridTypeList').each((_i, el) => {
    let link = $(el).find('a').first().attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://andrecaetano.com.br${link}`;

    const titulo = $(el).find('.det-lista strong a').text().trim();
    let bairro = '';
    const loc = $(el).find('.loc b').first().text().trim();
    if(loc) bairro = loc;
    else bairro = 'Franca';

    const endereco = normalizeNeighborhoodName(bairro);

    let valorStr = $(el).find('.valorImovel b').text().replace(/R\$/g, '').replace(/\./g, '').trim();
    const valor = getFixValue(valorStr);

    let quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.caracts-bottom span').each((_j, feat) => {
        const text = $(feat).text().toLowerCase().trim();
        const num = parseInt($(feat).find('b').text().trim());
        if(text.includes('dorm') || text.includes('quart')) quartos = num;
        if(text.includes('banh') || text.includes('sut')) banheiros = num;
        if(text.includes('garag') || text.includes('vaga')) vagas = num;
    });

    const imagens: string[] = [];
    const imgStr = $(el).find('.lazyload').attr('data-src') || $(el).find('img').attr('src');
    if (imgStr) {
        imagens.push(imgStr.startsWith('http') ? imgStr : `https://andrecaetano.com.br${imgStr}`);
    }

    // Description contains area info optionally
    const descricao = $(el).find('.descr').text().trim();
    let area = 0;
    const areaMatch = descricao.match(/(\d+)\s*(m|m2|metros)/i);
    if(areaMatch) area = parseInt(areaMatch[1]);

    if (link && valor > 0) {
      imoveis.push({
        titulo: titulo || `Imóvel em ${endereco}`,
        descricao,
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
        site: 'andrecaetano.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd, html };
}
