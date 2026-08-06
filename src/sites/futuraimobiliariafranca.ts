import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://www.futuraimobiliariafranca.com.br/secao/venda',
  name: 'futuraimobiliariafranca.com.br',
  driver: 'axios',
  itemsPerPage: 20, // Realmente é 17 por page aqui, ou algo assim. 20 is safe
  params: [],
  getPaginateParams: (page: number) => {
    // A paginação na URL é por paged. Ex: https://www.futuraimobiliariafranca.com.br/secao/venda?page=2
    return { url: `https://www.futuraimobiliariafranca.com.br/secao/venda?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  // Fix the encoding
  let htmlDecoded = html;
  if (html.includes('�')) {
    htmlDecoded = Buffer.from(html, 'binary').toString('utf8');
  }

  const $ = cheerio.load(htmlDecoded);

  const imoveis: Imoveis[] = [];

  $('.gridTypeList').each((_i, el) => {
    const linkAttr = $(el).find('.det-lista a').first().attr('href');
    if (!linkAttr) return;
    const link = linkAttr.startsWith('http') ? linkAttr : `https://www.futuraimobiliariafranca.com.br${linkAttr}`;

    let tituloRaw = $(el).find('.det-lista a').first().text().trim();
    if (!tituloRaw) return;

    let enderecoRaw = $(el).find('.loc b').first().text().trim();
    if (!enderecoRaw) {
        const text = $(el).find('.loc').text();
        enderecoRaw = text.split('/')[0].trim();
    }
    const endereco = normalizeNeighborhoodName(enderecoRaw);

    const priceText = $(el).find('.valorImovel b').text().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const valor = parseFloat(priceText || '0');

    if (valor <= 0) return;

    const imagens: string[] = [];
    const imgSrc = $(el).find('img.lazyload').attr('data-src') || $(el).find('img.lazyload').attr('src');
    if (imgSrc) {
      imagens.push(imgSrc.startsWith('http') ? imgSrc : `https://www.futuraimobiliariafranca.com.br${imgSrc}`);
    }

    let quartos = 0, banheiros = 0, vagas = 0;
    const area = 0;

    const caracHtml = $(el).find('.caracts').html() || '';
    const regexQuartos = /Dormit.*rios:\s*<b>(\d+)<\/b>/i;
    const regexBanheiros = /Banheiros:\s*<b>(\d+)<\/b>/i;
    const regexVagas = /Garagens:\s*<b>(\d+)<\/b>/i;

    let quartosMatch = caracHtml.match(regexQuartos);
    if (quartosMatch) quartos = parseInt(quartosMatch[1]);

    const banheirosMatch = caracHtml.match(regexBanheiros);
    if (banheirosMatch) banheiros = parseInt(banheirosMatch[1]);

    const vagasMatch = caracHtml.match(regexVagas);
    if (vagasMatch) vagas = parseInt(vagasMatch[1]);

    if (valor > 0) {
        imoveis.push({
            titulo: tituloRaw,
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
            site: 'futuraimobiliariafranca.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd: imoveis.length, html };
}
