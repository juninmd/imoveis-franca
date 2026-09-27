import * as cheerio from 'cheerio';
import { Site, Imoveis } from '../types';
import { getFixValue, normalizeNeighborhoodName as cleanTitle } from '../utils';

const site: Site = {
  name: 'fortscunha',
  driver: 'axios',
  enabled: true,
  url: 'https://www.fortscunha.com.br/imoveis',
  itemsPerPage: 1000,
  getPaginateParams: (_page) => ({}),
  adapter: async (html: string) => {
    const $ = cheerio.load(html);

    const imoveis: Imoveis[] = [];

    $('.single-project').each((_i, el) => {
       const link = $(el).find('.lower-content h5 a').attr('href') || '';
       const titulo = $(el).find('.lower-content h5 a').text().trim();
       const rawLocation = $(el).find('.lower-content').text().split(titulo)[1] || '';
       const location = rawLocation.replace('Franca -', '').trim().split('\n')[0];
       const finalTitle = titulo + (location ? ' em ' + location : '');

       const priceStr = $(el).find('.valor-pacote').text().trim();
       const valor = getFixValue(priceStr.replace(/[^0-9,]/g, ''));

       const img = $(el).find('img').attr('src') || '';

       let area = 0;
       let quartos = 0;
       let banheiros = 0;
       let vagas = 0;

       $(el).find('.valores-imovel').each((_j, val) => {
          const text = $(val).text().trim();
          if ($(val).find('.fa-arrows').length > 0) {
              area = getFixValue(text.replace(/[^0-9,]/g, ''));
          } else if ($(val).find('.fa-bed').length > 0) {
              quartos = parseInt(text) || 0;
          } else if ($(val).find('.fa-bath').length > 0) {
              banheiros = parseInt(text) || 0;
          } else if ($(val).find('.fa-car').length > 0) {
              vagas = parseInt(text) || 0;
          }
       });

       if (link && !link.includes('aluga') && !link.includes('aluguel') && valor > 0) {
           imoveis.push({
              site: 'fortscunha',
              titulo: cleanTitle(finalTitle),
              descricao: finalTitle,
              imagens: [img],
              endereco: location,
              valor: valor,
              area: area,
              areaTotal: area,
              quartos: quartos,
              link: link,
              banheiros: banheiros,
              vagas: vagas,
              precoPorMetro: area > 0 ? (valor / area) : 0,
              entrada: valor * 0.2,
           });
       }
    });

    return {
      qtd: imoveis.length,
      imoveis,
    };
  }
};

export default site;
