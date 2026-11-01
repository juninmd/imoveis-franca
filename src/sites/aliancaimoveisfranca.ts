import { Site, Imoveis } from '../types';
import * as cheerio from 'cheerio';

export default {
  enabled: true,
  name: 'aliancaimoveisfranca.com.br',
  driver: 'axios',
  url: 'https://aliancaimoveisfranca.com.br/busca.php',
  method: 'POST',
  itemsPerPage: 20,
  payload: { finalidade: 'venda' },
  getPaginateParams: (page: number) => {
    return { payload: { finalidade: 'venda', pag: page } };
  },
  adapter: async (html: string) => {
    const $ = cheerio.load(html);
    const imoveis: Imoveis[] = [];

    $('a[href^="imovel1.php?id="]').each((_i, el) => {
      const parent = $(el);
      const link = parent.attr('href') || '';

      const priceStr = parent.find('.tipo_imoveis p').text().trim();
      let price = 0;
      if (priceStr) {
          const match = priceStr.match(/R\$\s*([\d.,]+)/);
          if (match) {
              price = parseFloat(match[1].replace(/\./g, "").replace(",", "."));
          }
      }

      const addressHtml = parent.find('.endereco_imoveis p').map((_i, p) => $(p).text().trim()).get();
      const title = addressHtml[0] || 'Imóvel em Franca';
      const address = addressHtml.join(' - ');

      const desc = parent.find('.descricao_imoveis p').text().trim();

      let area = 0;
      let bedrooms = 0;

      parent.find('.icons_imoveis > div').each((_i, iconDiv) => {
          const text = $(iconDiv).text().trim();
          if (text.includes('m²')) {
              area = parseFloat(text.replace('m²', '').trim());
          }
          const iconHtml = $(iconDiv).html();
          if (iconHtml && iconHtml.includes('fa-bed')) {
              bedrooms = parseInt(text, 10) || 0;
          }
      });

      const style = parent.find('.imoveis > div').first().attr('style') || '';
      const bgMatch = style.match(/url\(['"]?(.*?)['"]?\)/);
      const images: string[] = [];
      if (bgMatch && bgMatch[1]) {
          images.push(bgMatch[1]);
      }

      if (price > 0) {
        imoveis.push({
            site: 'aliancaimoveisfranca.com.br',
            titulo: title,
            descricao: desc,
            endereco: address,
            valor: price,
            area,
            areaTotal: area,
            quartos: bedrooms,
            banheiros: 0,
            vagas: 0,
            link: `https://aliancaimoveisfranca.com.br/${link}`,
            imagens: images,
            precoPorMetro: area > 0 ? price / area : 0,
            entrada: 0,
            tipo: 'venda',
            valorMedioBairroPorAreaTotal: 0
        });
      }
    });

    return {
      imoveis,
      qtd: imoveis.length,
    };
  }
} as Site;
