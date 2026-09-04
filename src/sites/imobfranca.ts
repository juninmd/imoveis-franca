import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://imobfranca.com.br/imovel/?finalidade=venda',
  name: 'imobfranca.com.br',
  driver: 'axios',
  itemsPerPage: 16,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://imobfranca.com.br/imovel/?finalidade=venda&pag=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const imoveis: Imoveis[] = [];
  const $ = cheerio.load(html);

  let qtd = 0;
  const qtdText = $('body').text().match(/(\d+)\s*imóveis encontrados/i);
  if (qtdText) {
      qtd = parseInt(qtdText[1]);
  } else {
      const fallbackMatch = html.match(/<strong>(\d+)<\/strong>\s*im&oacute;veis encontrados/i);
      if (fallbackMatch) {
          qtd = parseInt(fallbackMatch[1]);
      }
  }

  $('.item-lista').each((_i, el) => {
      let link = $(el).find('a').first().attr('href');
      if (!link) return;
      if (link.startsWith('/')) link = `https://imobfranca.com.br${link}`;

      const titulo = $(el).find('h3').first().text().trim();
      const enderecoText = $(el).find('h3, small').text().trim();

      const bairro = enderecoText.split('-')[0].trim();
      const endereco = normalizeNeighborhoodName(bairro);

      let valorStr = $(el).find('.desc-item-lista li').first().text().trim();
      if(!valorStr) {
          valorStr = $(el).text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
      }
      const cleanPrice = valorStr.replace(/R\$/g, '').replace(/\./g, '').trim();
      const valor = getFixValue(cleanPrice);

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;

      $(el).find('.icones a').each((_j, det) => {
          const tooltip = $(det).attr('data-tooltip') || '';
          const text = $(det).text().replace(/[^\d.,]/g, '').replace(',', '.');
          const val = parseFloat(text) || 0;

          if(tooltip.toLowerCase().includes('área') || tooltip.toLowerCase().includes('area')) {
              area = val;
          } else if(tooltip.toLowerCase().includes('dormitório') || tooltip.toLowerCase().includes('dormitorio')) {
              quartos = val;
          } else if(tooltip.toLowerCase().includes('banheiro')) {
              banheiros = val;
          } else if(tooltip.toLowerCase().includes('vaga')) {
              vagas = val;
          }
      });

      const imagens: string[] = [];
      const imgStr = $(el).find('img').attr('src');
      if (imgStr) {
          imagens.push(imgStr.startsWith('http') ? imgStr : `https://imobfranca.com.br${imgStr}`);
      }

      if (link && valor > 0) {
        imoveis.push({
          titulo: titulo || `Imóvel em ${endereco}`,
          descricao: '',
          imagens,
          endereco,
          valor,
          area: area || 0,
          areaTotal: area || 0,
          quartos,
          link,
          banheiros,
          vagas,
          precoPorMetro: area > 0 ? valor / area : 0,
          site: 'imobfranca.com.br',
          entrada: valor * 0.20
        });
      }
  });

  return { imoveis, qtd: imoveis.length > 0 ? (qtd || imoveis.length) : 0, html };
}
