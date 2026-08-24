import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://faleirosimoveis.com.br/pesquisa-de-imoveis/?locacao_venda=V&id_cidade[]=63&id_tipo_imovel=12&finalidade=0',
  name: 'faleirosimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://faleirosimoveis.com.br/pesquisa-de-imoveis/?locacao_venda=V&id_cidade[]=63&id_tipo_imovel=12&finalidade=0&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const qtdText = `${$('h1').text()} ${$('.pagesNav').text()}`;
  const qtdMatch = qtdText.match(/(\d+)\s*-\s*imóveis/i) || qtdText.match(/(\d+)\s+imóveis/i) || qtdText.match(/de\s+(\d+)\s+resultados?/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  $('dl.gridTypeList').each((_i, el) => {
    const linkAttr = $(el).find('a[href*="/detalhes-imovel/"]').first().attr('href');
    if (!linkAttr) return;
    const link = `https://faleirosimoveis.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`;

    let titulo = $(el).find('.det-lista strong a').first().text().trim();
    if (!titulo) titulo = $(el).find('img').attr('alt') || 'Imóvel';

    let endereco = $(el).find('.loc b').first().text().trim();
    endereco = endereco ? normalizeNeighborhoodName(endereco) : 'Centro';

    const valorStr = $(el).find('.valorImovel b').first().text();
    const valor = parseFloat(valorStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
    if (valor <= 0) return;

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    $(el).find('.caracts-bottom span').each((_k, featEl) => {
       const label = $(featEl).find('small').text().toLowerCase();
       const num = parseInt($(featEl).find('b').text()) || 0;

       if (label.includes('área') || label.includes('area') || label.includes('m²')) {
           area = num;
       } else if (label.includes('dorm')) {
           quartos = num;
       } else if (label.includes('banh')) {
           banheiros = num;
       } else if (label.includes('vaga') || label.includes('garage')) {
           vagas = num;
       }
    });

    const imgEl = $(el).find('.foto-lista img').first();
    const imgUrl = imgEl.attr('data-src') || imgEl.attr('src');
    const imagens = imgUrl ? [imgUrl] : [];

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
        site: 'faleirosimoveis.com.br',
        entrada: valor * 0.20
    });
  });

  return { imoveis, qtd, html };
}
