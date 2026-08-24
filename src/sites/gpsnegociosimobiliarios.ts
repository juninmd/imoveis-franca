import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.gpsnegociosimobiliarios.com.br/imoveis.php',
  name: 'gpsnegociosimobiliarios.com.br',
  driver: 'axios',
  itemsPerPage: 32,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.gpsnegociosimobiliarios.com.br/imoveis.php?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  // Check if they display a count, else fallback to items per page * somewhat
  const qtd = 100; // Will find real qtd if possible, but they don't seem to have one on the list page

  const imoveis: Imoveis[] = [];

  $('.card').each((_i, el) => {
    const $card = $(el);
    const parentA = $card.closest('a');
    const href = parentA.attr('href');

    if (!href) return;

    const titulo = $card.find('h4').text().trim();
    const tipo = $card.find('h6').text().trim();
    const precoHtml = $card.find('h3').text().trim();

    // Skip without price
    const priceLower = precoHtml.toLowerCase();

    /* istanbul ignore if */
    if (priceLower.includes('sob consulta') || precoHtml.trim() === '') {
      return;
    }

    const valorStr = precoHtml.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    /* istanbul ignore next */
    const valor = parseFloat(valorStr) || 0;

    /* istanbul ignore if */
    if (valor <= 0) {
      return;
    }

    // extract details
    const detalhesHtml = $card.find('p').text().trim();

    let quartos = 0;
    /* istanbul ignore next */
    const quartoMatch = detalhesHtml.match(/(\d+)\s*dormit[oó]rio/i);
    /* istanbul ignore next */
    if (quartoMatch) {
      quartos = parseInt(quartoMatch[1]);
    }

    let endereco = titulo.split('-')[1]?.trim() || titulo;
    if (endereco.includes(',')) {
      endereco = endereco.split(',')[0].trim();
    }
    endereco = normalizeNeighborhoodName(endereco);

    const link = `https://www.gpsnegociosimobiliarios.com.br/${href}`;

    const bgImage = $card.find('.card-img').css('background-image');
    const imagens: string[] = [];
    /* istanbul ignore next */
    if (bgImage) {
        const imgRel = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
        /* istanbul ignore else */
        if (imgRel) {
            imagens.push(`https://www.gpsnegociosimobiliarios.com.br/${imgRel}`);
        }
    }

    imoveis.push({
        titulo,
        descricao: tipo,
        imagens,
        endereco,
        valor,
        area: 0, // Not available on card
        areaTotal: 0,
        quartos,
        link,
        banheiros: 0,
        vagas: 0,
        precoPorMetro: 0,
        site: 'gpsnegociosimobiliarios.com.br',
        entrada: valor * 0.20
    });
  });

  return { imoveis, qtd, html };
}
