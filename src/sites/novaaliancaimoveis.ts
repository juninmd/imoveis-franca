import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.novaaliancaimoveis.com.br/imoveis',
  name: 'novaaliancaimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 30,
  getPaginateParams: (page: number) => {
    return { url: `https://www.novaaliancaimoveis.com.br/imoveis?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  let qtd = 0;
  try {
    const text = $('.pagination-info').text() || '';
    const match = text.match(/de\s+(\d+)/);
    if (match) {
      qtd = parseInt(match[1], 10);
    }
  } catch (e) { /* ignore */ }

  $('.property-card, .imovel-card').each((_i, el) => {
    try {
      const link = $(el).find('a').first().attr('href') || '';
      const titulo = $(el).find('.title, h2, h3').first().text().trim() || 'Imóvel em Franca';
      const endereco = $(el).find('.address, .endereco').first().text().trim() || 'Franca, SP';
      const descricao = '';

      const priceText = $(el).find('.price, .valor').first().text().trim();
      let valor = 0;
      const priceMatch = priceText.match(/R\$\s*([\d.,]+)/);
      if (priceMatch) {
          valor = parseFloat(priceMatch[1].replace(/\./g, "").replace(",", "."));
      }

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;

      $(el).find('.features li, .caracteristicas span').each((_j, feat) => {
          const t = $(feat).text().toLowerCase();
          if (t.includes('m²') || t.includes('area') || t.includes('área')) {
              const m = t.match(/(\d+)/);
              if (m) area = parseInt(m[1], 10);
          }
          if (t.includes('quarto') || t.includes('dorm')) {
              const m = t.match(/(\d+)/);
              if (m) quartos = parseInt(m[1], 10);
          }
          if (t.includes('banheiro') || t.includes('suite') || t.includes('suíte')) {
              const m = t.match(/(\d+)/);
              if (m) banheiros = parseInt(m[1], 10);
          }
          if (t.includes('vaga') || t.includes('garagem')) {
              const m = t.match(/(\d+)/);
              if (m) vagas = parseInt(m[1], 10);
          }
      });

      const imagens: string[] = [];
      const img = $(el).find('img').first().attr('src');
      if (img) imagens.push(img);

      if (valor > 0) {
        imoveis.push({
          site: 'novaaliancaimoveis.com.br',
          titulo,
          descricao,
          endereco,
          valor,
          area,
          areaTotal: area,
          quartos,
          banheiros,
          vagas,
          link: link.startsWith('http') ? link : `https://www.novaaliancaimoveis.com.br${link}`,
          imagens,
          precoPorMetro: area > 0 ? valor / area : 0,
          entrada: 0,
          tipo: 'venda',
          valorMedioBairroPorAreaTotal: 0
        });
      }
    } catch (e) { /* ignore */ }
  });

  return { imoveis, qtd: qtd || imoveis.length, html: '' };
}
