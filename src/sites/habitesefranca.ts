import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://habitesefranca.com.br/comprar/sp/franca',
  name: 'habitesefranca.com.br',
  driver: 'axios',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://habitesefranca.com.br/comprar/sp/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtdText = $('.qtd_imoveis_encontrado').text();
  let qtd = 0;
  if (qtdText) {
      qtd = parseInt(qtdText.replace(/\D/g, '')) || 0;
  }

  if(qtd === 0) qtd = 1000;

  const imoveis: Imoveis[] = [];

  $('.resultado').each((_i, el) => {
    const titulo = $(el).find('.tipo').text().trim();
    const bairro = $(el).find('.bairro').text().trim();
    const endereco = normalizeNeighborhoodName(bairro);

    const valorText = $(el).find('.valor h5').text().trim();
    const valor = parseFloat(valorText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    let quartos = 0;
    let banheiros = 0;
    let vagas = 0;
    let area = 0;

    $(el).find('.detalhes .detalhe').each((_j, det) => {
        const title = $(det).attr('title')?.toLowerCase() || '';
        const val = parseInt($(det).find('span').first().text()) || 0;

        if (title.includes('dormitórios')) {
            quartos = val;
        } else if (title.includes('banheiros')) {
            banheiros = val;
        } else if (title.includes('vagas')) {
            vagas = val;
        } else if (title.includes('área')) {
            area = val;
        }
    });

    let linkAttr = $(el).find('a').first().attr('href');
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://habitesefranca.com.br${linkAttr}`) : '';

    const imgSrc = $(el).find('img').first().attr('src');
    const imagens = imgSrc ? [imgSrc] : [];

    if (link && valor > 0) {
        imoveis.push({
            titulo: titulo || 'IMÓVEL',
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
            site: 'habitesefranca.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
