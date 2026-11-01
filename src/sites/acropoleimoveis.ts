import { Site, Imoveis } from '../types';
import * as cheerio from 'cheerio';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const https = require('https');

export default {
  enabled: true,
  name: 'acropoleimoveis.com.br',
  driver: 'axios',
  url: 'https://www.acropoleimoveis.com.br/imoveis/venda',
  itemsPerPage: 10,
  axiosConfig: {
    httpsAgent: new https.Agent({ rejectUnauthorized: false })
  },
  getPaginateParams: (page: number) => ({ url: `https://www.acropoleimoveis.com.br/imoveis/venda?page=${page}` }),
  adapter: async (html: string) => {
    const $ = cheerio.load(html);
    const imoveis: Imoveis[] = [];

    $('.property_listing').each((_i, el) => {
      const link = $(el).find('a.unit_details_x').attr('href') || $(el).find('a').first().attr('href');
      if (!link) return;

      const titulo = $(el).find('h4').text().trim().replace(/<!--.*-->/g, '').trim();
      const locationRaw = $(el).find('.property_location_image').text().trim().replace(/[\r\n\t]+/g, ' ');

      let bairro = 'Franca'; // Fallback
      const locMatch = locationRaw.split(',');
      if (locMatch.length > 0) {
          bairro = locMatch[0].replace(' ', '').trim();
      }

      const end = normalizeNeighborhoodName(bairro);

      const priceStr = $(el).find('.property_value').text().trim();
      const valor = getFixValue(priceStr.replace(/R\$/g, '').trim());

      let quartos = 0, banheiros = 0, vagas = 0, area = 0;

      $(el).find('.property_listing_details span').each((_j, detail) => {
          const txt = $(detail).text().trim().toLowerCase();
          const numMatch = txt.match(/\d+/);
          const num = numMatch ? parseInt(numMatch[0]) : 0;

          if (txt.includes('quarto') || txt.includes('dormitório')) quartos = num;
          if (txt.includes('banheiro') || txt.includes('suite')) banheiros = num;
          if (txt.includes('vaga') || txt.includes('garagem')) vagas = num;
          if (txt.includes('m²')) area = num;
      });

      const imagens: string[] = [];
      $(el).find('.carousel-item img').each((_j, img) => {
          const src = $(img).attr('data-src') || $(img).attr('src');
          if (src && src.includes('http') && !src.includes('loading')) {
              imagens.push(src);
          }
      });

      if (valor > 0) {
        imoveis.push({
          site: 'acropoleimoveis.com.br',
          titulo: `${titulo} em ${end}`,
          descricao: $(el).find('.listing_details').text().trim(),
          imagens,
          endereco: `${end}, Franca - SP`,
          valor,
          area,
          areaTotal: area,
          quartos,
          banheiros,
          vagas,
          link: link.startsWith('http') ? link : `https://www.acropoleimoveis.com.br${link}`,
          entrada: valor * 0.20,
          precoPorMetro: area > 0 ? valor / area : 0
        });
      }
    });

    return {
      imoveis,
      qtd: imoveis.length > 0 ? 100 : 0
    };
  }
} as Site;
