import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://mercadoimoveisfranca.com.br/acao/vendas/',
  name: 'mercadoimoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return {
        url: `https://mercadoimoveisfranca.com.br/acao/vendas/page/${page}/`
    };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  $('.property_listing').each((_i, el) => {
      const link = $(el).attr('data-link') || $(el).find('a').attr('href');
      if (!link) return;

      const titulo = $(el).find('h4 a').text().trim() || $(el).find('.listing_title').text().trim();
      if (!titulo) return;

      const enderecoElement = $(el).find('.property_location').text().trim() || $(el).find('.property_location_image a').text().trim();
      const bairro = enderecoElement || 'Franca';
      const endereco = normalizeNeighborhoodName(bairro);

      const precoText = $(el).find('.listing_unit_price_wrapper').text().trim();
      const isRental = link.includes('locacao') || precoText.toLowerCase().includes('mês') || titulo.toLowerCase().includes('alugar') || precoText.toLowerCase().includes('mes');
      const cleanPrice = precoText.replace(/R\$/g, '').replace(/mês/gi, '').replace(/\./g, '').trim();
      const valor = getFixValue(cleanPrice);

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;

      $(el).find('.inforoom, .infobath, .infosize, .infogarage').each((_, det) => {
          const className = $(det).attr('class') || '';
          const text = $(det).text().toLowerCase().trim();
          if (className.includes('infosize') || text.includes('m²')) {
              const numMatch = text.match(/[\d.,]+/);
              if (numMatch) {
                 area = getFixValue(numMatch[0].replace(/\./g, ''));
              }
          } else if (className.includes('inforoom')) {
              quartos = parseInt(text.replace(/[^\d]/g, '')) || 0;
          } else if (className.includes('infobath')) {
              banheiros = parseInt(text.replace(/[^\d]/g, '')) || 0;
          } else if (className.includes('infogarage')) {
              vagas = parseInt(text.replace(/[^\d]/g, '')) || 0;
          }
      });

      const imagens: string[] = [];
      const bgStyle = $(el).find('.listing-unit-img-wrapper').attr('style');
      if (bgStyle) {
          const match = bgStyle.match(/url\(['"]?([^'"]+)['"]?\)/);
          if (match && match[1]) imagens.push(match[1]);
      }
      $(el).find('img').each((_, img) => {
          const src = $(img).attr('data-original') || $(img).attr('src');
          if (src && !src.includes('lazy') && !src.includes('loading')) {
             imagens.push(src);
          }
      });
      const uniqueImagens = [...new Set(imagens)];

      if (!isRental && link && valor > 0) {
          imoveis.push({
              titulo,
              descricao: '',
              imagens: uniqueImagens,
              endereco,
              valor,
              area,
              areaTotal: area,
              quartos,
              link,
              banheiros,
              vagas,
              precoPorMetro: area > 0 ? valor / area : 0,
              site: 'mercadoimoveisfranca.com.br',
              entrada: valor * 0.20
          });
      }
  });

  return { imoveis, qtd: imoveis.length, html };
}
