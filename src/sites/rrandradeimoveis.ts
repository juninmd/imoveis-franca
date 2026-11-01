import { Imoveis, Site } from '../types';
import * as cheerio from 'cheerio';


export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://rrandradeimoveis.com.br/imoveis/a-venda',
  name: 'rrandradeimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 20,
  params: [{
    'page': 1,
  }],
  getPaginateParams: (page: number) => ({ params: { page } }), // Needs puppet because it's a dynamic SPA
  adapter,
  waitFor: 'div.MuiGrid-root.MuiGrid-item',
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  // Wait for puppet to render the page and then parse the DOM
  const imoveis: Imoveis[] = [];
  let qtd = 0;

  const $ = cheerio.load(html);

  // Try to find quantity in a header text like "120 imóveis encontrados"
  const qtdText = $('h1, h2, span, p').filter((_, el) => $(el).text().toLowerCase().includes('encontrado')).text();
  const match = qtdText.match(/(\d+)/);
  if (match) {
      qtd = parseInt(match[1]);
  }

  const cards = $('a[href*="/imovel/"]').toArray();
  for (const el of cards) {
      const $el = $(el);
      const linkPath = $el.attr('href');
      if (!linkPath) continue;

      const link = linkPath.startsWith('http') ? linkPath : `https://rrandradeimoveis.com.br${linkPath}`;

      // Need to find parent card container
      const card = $el.closest('.MuiGrid-item');
      if (!card.length) continue;

      const titulo = card.find('h3, h4').first().text().trim() || $el.text().trim();
      const descricao = '';

      let valor = 0;
      card.find('*').each((_, elem) => {
          const text = $(elem).text();
          if (text.includes('R$')) {
              const val = parseFloat(text.replace('R$', '').replace(/\./g, '').trim().split(',')[0]);
              if (val > 1000) valor = val;
          }
      });

      const imagens: string[] = [];
      card.find('img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src) imagens.push(src);
      });

            let quartos = 0;
      let banheiros = 0;
      let vagas = 0;
      let area = 0;

      card.find('p, span').each((_, elem) => {
          const text = $(elem).text().trim().toLowerCase();

          if (text.includes('m²')) {
              area = parseFloat(text.replace(/[^0-9.]/g, '') || '0');
          }
          if (text.includes('quarto') || text.includes('dorm')) {
               quartos = parseInt(text.replace(/[^0-9]/g, '') || '0');
          }
          if (text.includes('banheiro') || text.includes('suíte')) {
               banheiros = parseInt(text.replace(/[^0-9]/g, '') || '0');
          }
          if (text.includes('vaga') || text.includes('garagem')) {
               vagas = parseInt(text.replace(/[^0-9]/g, '') || '0');
          }
      });

      const areaTotal = area;
      const precoPorMetro = areaTotal > 0 ? valor / areaTotal : 0;

      if (valor > 0 && !imoveis.some(i => i.link === link)) {
          imoveis.push({
              titulo,
              descricao,
              imagens,
              endereco: 'FRANCA',
              valor,
              area,
              areaTotal,
              quartos,
              banheiros,
              vagas,
              link,
              precoPorMetro,
              site: 'rrandradeimoveis.com.br',
              entrada: valor * 0.20,
          });
      }
  }

  if (qtd === 0) qtd = imoveis.length;

  return { imoveis, qtd, html };
};
