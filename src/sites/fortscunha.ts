import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.fortscunha.com.br/imoveis',
  name: 'fortscunha.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.fortscunha.com.br/imoveis?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;

  const lastPageLink = $('.pagination li a').last().attr('href');
  if (lastPageLink) {
    const pageMatch = lastPageLink.match(/pagina=(\d+)/);
    if (pageMatch) {
       qtd = parseInt(pageMatch[1]) * 12;
    }
  }

  if(qtd === 0) qtd = 50;

  $('.single-item').each((_i, el) => {
    const $el = $(el);
    let link = $el.find('h5 a').attr('href');
    if (!link) return;
    if (link.startsWith('/')) link = `https://www.fortscunha.com.br${link}`;

    const titulo = $el.find('h5 a').text().trim();

    const locText = $el.find('.lower-content').text();
    const locMatch = locText.match(/Franca - (.*)/);
    const bairro = locMatch ? locMatch[1].trim() : 'Franca';
    const endereco = normalizeNeighborhoodName(bairro);

    const priceText = $el.find('.price').text();
    let valorStr = '';
    if(priceText) {
       valorStr = priceText.replace(/R\$/g, '').replace(/\./g, '').trim();
    }
    const valor = getFixValue(valorStr);

    let quartos = 0, banheiros = 0, vagas = 0, area = 0;

    $el.find('.valores-imovel').each((_j, feat) => {
       const text = $(feat).text().trim();
       const val = parseInt(text) || 0;

       if($(feat).find('.fa-bed').length > 0) quartos = val;
       if($(feat).find('.fa-bath').length > 0) banheiros = val;
       if($(feat).find('.fa-car').length > 0) vagas = val;
       if($(feat).find('.fa-arrows').length > 0) area = val;
    });


    const imagens: string[] = [];
    const imgStr = $el.find('.img-box img').attr('src');
    if (imgStr) {
        imagens.push(imgStr.startsWith('http') ? imgStr : `https://www.fortscunha.com.br${imgStr}`);
    }

    if (link && valor > 0) {
      imoveis.push({
        titulo: titulo || `Imóvel em ${endereco}`,
        descricao: '',
        imagens,
        endereco,
        valor,
        area,
        areaTotal: 0,
        quartos,
        link,
        banheiros,
        vagas,
        precoPorMetro: area > 0 ? valor / area : 0,
        site: 'fortscunha.com.br',
        entrada: valor * 0.20
      });
    }
  });

  return { imoveis, qtd: imoveis.length > 0 ? qtd : 0, html };
}
