import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://quintareimoveis.com.br/imovel/?finalidade=venda',
  name: 'quintareimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://quintareimoveis.com.br/imovel/?finalidade=venda&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  // O site e latin1 e o driver decodifica como utf8: acentos viram U+FFFD, removemos.
  const $ = cheerio.load(html.replace(/�/g, ''));

  const qtdMatch = $('.topsearch__total strong').first().text().match(/\d+/) || $('body').text().match(/(\d+)\s*imóveis encontrados/i);
  const qtd = qtdMatch ? parseInt(qtdMatch[qtdMatch.length > 1 ? 1 : 0], 10) : 0;

  $('.imovelcard').each((_i, el) => {
    let link = $(el).attr('data-link') || $(el).find('a.imovelcard__img').attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://quintareimoveis.com.br${link}`;

    // "Bairro, Cidade / UF" (o site mistura outras cidades; imoveis sem cidade sao descartados)
    const local = $(el).find('.imovelcard__info__local').first().text().trim();
    if (!/franca/i.test(local.split(',').slice(1).join(','))) return;
    const endereco = normalizeNeighborhoodName(local.split(',')[0].trim());

    const titulo = ($(el).find('a.imovelcard__img').attr('title') || '').trim()
      || `${$(el).find('.imovelcard__info__ref').text().split('-').pop()?.trim() || 'Imóvel'} em ${endereco}`;

    const valor = getFixValue($(el).find('.imovelcard__valor__valor').first().text().replace(/R\$/g, '').trim());

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.imovelcard__info__feature p').each((_j, f) => {
      const text = $(f).text().replace(/\s+/g, ' ').trim().toLowerCase();
      const num = parseFloat(((text.match(/[\d.,]+/) || ['0'])[0]).replace(/\./g, '').replace(',', '.')) || 0;
      if (/m²/.test(text)) {
        // prefere area util/construida; senao a primeira encontrada
        if (!area || /til|constru/.test(text)) area = num;
      } else if (text.includes('dormit')) {
        quartos = num;
      } else if (text.includes('banheiro')) {
        banheiros = num;
      } else if (text.includes('vaga')) {
        vagas = num;
      }
    });

    const imgStr = $(el).find('img').first().attr('src');
    const imagens: string[] = imgStr ? [imgStr.startsWith('http') ? imgStr : `https://quintareimoveis.com.br${imgStr}`] : [];

    if (valor > 0) {
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
        site: 'quintareimoveis.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? (qtd || imoveis.length) : 0, html };
}
