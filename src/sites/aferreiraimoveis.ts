import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.aferreiraimoveis.com.br/imovel/?finalidade=venda',
  name: 'aferreiraimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 15,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.aferreiraimoveis.com.br/imovel/?finalidade=venda&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;
  const lastPageMatch = html.match(/pag=(\d+)[^>]+>Última/);
  if (lastPageMatch) {
     qtd = parseInt(lastPageMatch[1]) * 15;
  } else {
     qtd = 1000;
  }


  $('.imovelcard').each((_i, el) => {
      let link = $(el).attr('data-link');
      if (!link) return;
      if (link.startsWith('/')) link = `https://www.aferreiraimoveis.com.br${link}`;

      const titleEl = $(el).find('a.imovelcard__img').first();
      const titulo = titleEl.attr('title') || '';

      const locText = $(el).find('.imovelcard__info__local').text().trim();
      const locParts = locText.split(',');
      let bairro = locParts[0] || 'Franca';
      bairro = bairro.trim();

      const endereco = normalizeNeighborhoodName(bairro);

      const valorEl = $(el).find('.imovelcard__valor__valor').first();
      valorEl.find('span').remove();
      const valorStr = valorEl.text().replace(/\./g, '').trim();
      const valor = getFixValue(valorStr);

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;

      $(el).find('.imovelcard__info__feature').each((_j, det) => {
          const text = $(det).text().toLowerCase().trim();
          if (text.includes('m²')) {
              const m = text.match(/[\d.,]+/);
              if (m) area = getFixValue(m[0].replace(/\./g, ''));
          } else if (text.includes('quarto') || text.includes('dorm') || $(det).find('.fa-bed').length > 0) {
              const m = text.match(/\d+/);
              if(m) quartos = parseInt(m[0]);
              else quartos = parseInt(text) || 0;
          } else if (text.includes('banh') || text.includes('suíte') || $(det).find('.fa-bath').length > 0) {
              const m = text.match(/\d+/);
              if(m) banheiros = parseInt(m[0]);
              else banheiros = parseInt(text) || 0;
          } else if (text.includes('vaga') || $(det).find('.fa-car').length > 0) {
              const m = text.match(/\d+/);
              if(m) vagas = parseInt(m[0]);
              else vagas = parseInt(text) || 0;
          }
      });

      const imagens: string[] = [];
      const imgSrc = titleEl.find('img').attr('src');
      if (imgSrc) {
          imagens.push(imgSrc.startsWith('http') ? imgSrc : `https://www.aferreiraimoveis.com.br${imgSrc}`);
      }

      if (link && valor > 0) {
          imoveis.push({
              titulo: titulo || `Imóvel em ${endereco}`,
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
              site: 'aferreiraimoveis.com.br',
              entrada: valor * 0.20
          });
      }
  });

  return { imoveis, qtd: imoveis.length > 0 && qtd === 1000 ? 50 : qtd, html };
}
