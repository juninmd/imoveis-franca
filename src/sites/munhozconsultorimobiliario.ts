import * as cheerio from 'cheerio';
import { Imoveis as Imovel, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.munhozconsultores.com.br/imoveis.php',
  name: 'munhozconsultorimobiliario.com.br',
  driver: 'axios',
  itemsPerPage: 50,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.munhozconsultores.com.br/imoveis.php?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imovel[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imovel[] = [];

  let qtd = 0;
  const qtdMatch = $('body').text().match(/(\d+)\s*imóveis encontrados/i) || $('body').text().match(/(\d+)\s*resultados/i);
  if (qtdMatch) {
      qtd = parseInt(qtdMatch[1]);
  }

  $('article').each((_i, el) => {
      let link = $(el).find('a[href*="/imoveis/"]').first().attr('href') || $(el).attr('onclick')?.match(/window\.open\('([^']+)'/)?.[1];
      if (!link) return;
      if (link.startsWith('/')) {
        link = `https://www.munhozconsultores.com.br${link}`;
      }

      const titulo = $(el).find('h2.c49-property-card_title, h3.c49-property-card_title').text().trim();
      if (!titulo) return;

      const enderecoElem = $(el).find('.c49-property-card_address').text().trim();
      const enderecoParts = enderecoElem.split(' - ');
      let endereco = enderecoElem;
      if (enderecoParts.length > 0) {
          endereco = normalizeNeighborhoodName(enderecoParts[0].trim());
      }

      const valorMatch = $(el).find('.c49-property-card_rent-price, .c49-property-card_sell-price, .c49-property-card_price').text().match(/R\$\s*([\d.,]+)/);
      const valorText = valorMatch ? valorMatch[1] : '0';
      const valor = parseFloat(valorText.replace(/\./g, '').replace(',', '.').trim() || '0');

      if (valor <= 0) return;

      const descricao = $(el).find('.c49-property-card_description').text().trim() || '';

      let quartos = 0, banheiros = 0, vagas = 0, area = 0;

      $(el).find('.c49-property-card_icons li').each((_, li) => {
          const text = $(li).text().toLowerCase();
          const numMatch = text.match(/(\d+)/);
          if (!numMatch) return;
          const num = parseInt(numMatch[1]);

          if (text.includes('quarto') || text.includes('dorm') || $(li).find('i.fa-bed').length) {
              quartos = num;
          } else if (text.includes('banheiro') || text.includes('suite') || $(li).find('i.fa-bath').length) {
              banheiros = num;
          } else if (text.includes('vaga') || text.includes('garagem') || $(li).find('i.fa-car').length) {
              vagas = num;
          } else if (text.includes('m²') || text.includes('area') || $(li).find('i.fa-arrows-alt').length) {
               area = parseFloat(text.replace(/[^\d.,]/g, '').replace(',', '.'));
          }
      });

      const imagens: string[] = [];
      $(el).find('img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && (src.includes('upload') || src.includes('imovel'))) {
              imagens.push(src.startsWith('http') ? src : `https://www.munhozconsultores.com.br${src}`);
          }
      });

      // Se não achou na tag img, tenta pegar do background-image
      $(el).find('.c49-carousel-photo-wrap').each((_, wrap) => {
          const style = $(wrap).attr('style') || '';
          const bgMatch = style.match(/background-image:\s*url\((['"]?)(.*?)\1\)/);
          if (bgMatch) {
              const src = bgMatch[2];
               if (src && !imagens.includes(src)) {
                   imagens.push(src.startsWith('http') ? src : `https://www.munhozconsultores.com.br${src}`);
               }
          }
      });

      imoveis.push({
          titulo,
          descricao,
          imagens,
          endereco,
          valor,
          area,
          areaTotal: area,
          quartos,
          banheiros,
          vagas,
          link,
          precoPorMetro: area > 0 ? valor / area : 0,
          site: 'munhozconsultorimobiliario.com.br',
          entrada: valor * 0.20,
      });
  });

  if (qtd === 0) qtd = imoveis.length;

  return { imoveis, qtd, html };
}
