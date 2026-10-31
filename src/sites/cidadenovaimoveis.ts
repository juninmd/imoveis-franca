import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils/index';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://cidadenovaimoveis.com.br/imoveis/a-venda/pagina-1',
  name: 'cidadenovaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://cidadenovaimoveis.com.br/imoveis/a-venda/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  $('a').each((_, el) => {
    if ($(el).find('.property-card').length > 0) {
      const card = $(el).find('.property-card');
      const linkAttr = $(el).attr('href');
      const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://cidadenovaimoveis.com.br${linkAttr}`) : '';

      const imgUrl = card.find('img').attr('src');
      const imagens = imgUrl ? [imgUrl.startsWith('http') ? imgUrl : `https://cidadenovaimoveis.com.br${imgUrl}`] : [];

      const title = card.find('h2').text().trim();
      let bairro = title; // fallback
      const infos = card.find('.content').text().trim().replace(/.+/g, ' ');

      const bairroMatch = infos.match(/([..çãõáéíóúâêô]+),.*Franca/i);
      if (bairroMatch) {
          bairro = bairroMatch[1].replace(/.*?(m2|.).*/g, '').trim();
      }

      const valorStr = card.find('h3, .h3, h4').last().text().trim() || infos.match(/R..*[..,]+/)?.[0] || '0';
      const valorNum = parseInt(valorStr.replace(/./g, '')) || 0;
      const valor = valorNum / 100;

      const iconValues = card.find('.icons, .d-flex.align-items-center').text().trim().replace(/.+/g, ' ').split(' ');
      let quartos = 0, suites = 0, banheiros = 0, vagas = 0;
      if (iconValues.length >= 4) {
          const vals = iconValues.map(v => parseInt(v) || 0);
          if (iconValues[0].includes('m2') || isNaN(parseInt(iconValues[0]))) {
             quartos = vals[1] || 0;
             suites = vals[2] || 0;
             banheiros = vals[3] || 0;
             vagas = vals[4] || 0;
          } else {
             quartos = vals[0] || 0;
             suites = vals[1] || 0;
             banheiros = vals[2] || 0;
             vagas = vals[3] || 0;
          }
      }

      const areaMatch = infos.match(/(.+(?:,.+)?).*m2/i) || iconValues[0]?.match(/(.+(?:,.+)?).*m2/i);
      const areaTexto = areaMatch ? areaMatch[1].replace(',', '.') : '0';
      const area = parseFloat(areaTexto) || 0;

      const endereco = normalizeNeighborhoodName(bairro).toUpperCase();

      let precoPorMetro = 0;
      if (valor > 0 && area > 0) {
        precoPorMetro = valor / area;
      }

      imoveis.push({
        titulo: title,
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
        precoPorMetro,
        site: 'cidadenovaimoveis.com.br',
        entrada: valor > 0 ? valor * 0.2 : 0,
      });
    }
  });

  let qtd = imoveis.length;

  const spanTexts: number[] = [];
  $('.pagination span, .pagination a').each((_, el) => {
       const num = parseInt($(el).text().trim());
       if (!isNaN(num)) spanTexts.push(num);
  });
  const paginationText = $('.pagination').text();
  const pages = paginationText.match(/(.+)/g);

  if (spanTexts.length > 0) {
      const maxPage = Math.max(...spanTexts);
      qtd = maxPage * 16;
  } else if (pages && pages.length > 0) {
      // Exclude values that look like listing counts instead of pages (like 123)
      const validPages = pages.map(p => parseInt(p)).filter(p => p < 100);
      if (validPages.length > 0) {
         const maxPage = Math.max(...validPages);
         qtd = maxPage * 16;
      }
  }

  return { imoveis, qtd, html };
}
