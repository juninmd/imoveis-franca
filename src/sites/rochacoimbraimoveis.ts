import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.rochacoimbraimoveis.com.br/venda',
  name: 'rochacoimbraimoveis.com.br',
  driver: 'puppet',
  waitFor: 'h2.card-title',
  itemsPerPage: 20,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.rochacoimbraimoveis.com.br/venda?page=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  $('a').each((_i, el) => {
      let link = $(el).attr('href');
      if (!link || !link.includes('/imovel/')) return;
      if (link.startsWith('/')) link = `https://www.rochacoimbraimoveis.com.br${link}`;

      const titulo = $(el).find('h2.card-title, .card-title').first().text().trim();
      if (!titulo) return;

      const enderecoElement = $(el).find('.card-text').first().text().trim();
      const matchLoc = titulo.match(/no\s+(.*)/i) || titulo.match(/em\s+(.*)/i);
      const bairro = enderecoElement || (matchLoc ? matchLoc[1].trim() : 'Franca');
      const endereco = normalizeNeighborhoodName(bairro.split('|')[0].trim());

      const precoElement = $(el).find('.preco-imovel-card').first().clone();
      precoElement.find('span').remove();
      const precoText = precoElement.text().trim();
      const cleanPrice = precoText.replace(/R\$/g, '').replace(/mês/gi, '').replace(/\./g, '').trim();
      const valor = getFixValue(cleanPrice);

      const isRental = link.includes('aluguel') || titulo.toLowerCase().includes('alugar') || precoText.toLowerCase().includes('mês');

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;

      $(el).find('.container-icon').each((_, det) => {
          const textMatch = $(det).text().toLowerCase().trim();
          if (textMatch.includes('m²')) {
              const numMatch = textMatch.match(/[\d.,]+/);
              if (numMatch) area = getFixValue(numMatch[0].replace(/\./g, ''));
          } else if (textMatch.includes('qto') || textMatch.includes('quarto') || textMatch.includes('dorm')) {
              quartos = parseInt(textMatch.replace(/[^\d]/g, '')) || 0;
          } else if (textMatch.includes('banh') || textMatch.includes('suite') || textMatch.includes('suíte')) {
              banheiros = parseInt(textMatch.replace(/[^\d]/g, '')) || 0;
          } else if (textMatch.includes('vaga') || textMatch.includes('garagem') || textMatch.includes('vg')) {
              vagas = parseInt(textMatch.replace(/[^\d]/g, '')) || 0;
          }
      });

      const imagens: string[] = [];
      $(el).find('img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && !src.includes('loading') && !src.includes('gif')) {
             imagens.push(src.startsWith('http') ? src : `https://www.rochacoimbraimoveis.com.br${src.startsWith('/') ? '' : '/'}${src}`);
          }
      });

      const uniqueImagens = [...new Set(imagens)];

      if (!isRental && link && valor > 0) {
          imoveis.push({
              titulo: titulo.replace(/<[^>]+>/g, '').trim(),
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
              site: 'rochacoimbraimoveis.com.br',
              entrada: valor * 0.20
          });
      }
  });

  return { imoveis, qtd: imoveis.length, html };
}
