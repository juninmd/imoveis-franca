import * as cheerio from 'cheerio';
import { Site } from '../types';

const vlicitimoveis: Site = {
  name: 'VLICIT IMÓVEIS',
  driver: 'axios',
  enabled: true,
  itemsPerPage: 18,
  url: 'https://www.vlicitimoveis.com.br/imoveis/a-venda/franca',
  getPaginateParams: (page: number) => {
    return {
       path: 'https://www.vlicitimoveis.com.br/busca',
       payload: 'action=imoveis&param%5B0%5D%5Bfilter_finalidade%5D%5B0%5D=sale&param%5B1%5D%5Bfilter_cidade%5D%5B0%5D=9144&Page=' + page,
       params: {
           method: 'POST',
           headers: {
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'x-requested-with': 'XMLHttpRequest',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
           }
       }
    };
  },
  adapter: async (html) => {
    if (!html) return { imoveis: [], qtd: 0 };

    let parsedHtml = html;
    try {
        const jsonResponse = JSON.parse(html);
        if (jsonResponse && jsonResponse.html) {
            parsedHtml = jsonResponse.html;
        }
    } catch (e) {
    }

    const $ = cheerio.load(parsedHtml);
    const imoveis: any[] = [];

    $('.LI_ImovelInner').each((_, el) => {
      const titleEl = $(el).find('a.Title');
      const titulo = titleEl.text().trim();
      const linkRel = titleEl.attr('href') || $(el).find('a.Image').attr('href');
      const link = linkRel ? (linkRel.startsWith('http') ? linkRel : `https://www.vlicitimoveis.com.br${linkRel.startsWith('/') ? '' : '/'}${linkRel}`) : '';

      const valorText = $(el).find('.BoxValores .ImovelValor .Valor').first().text().replace(/[^\d]/g, '');
      const valor = valorText ? parseInt(valorText, 10) : 0;

      const imgRel = $(el).find('img.BannerImage').attr('src') || $(el).find('img.BannerImage').attr('data-src');
      const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.vlicitimoveis.com.br${imgRel.startsWith('/') ? '' : '/'}${imgRel}`] : [];

      const endereco = $(el).find('.Endereco').text().trim().replace(/,\s*Brasil/g, '');

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;

      const resumoText = $(el).find('.Resumo').text();
      const matchArea = resumoText.match(/(?:Total|Útil):\s*(\d+)m²/i);
      if (matchArea) area = parseInt(matchArea[1], 10);

      const featuresText = $(el).find('.ResumoDescritivo').text();
      const matchQuartos = featuresText.match(/(\d+)\s*(?:dormitório|quarto)s?/i);
      if (matchQuartos) quartos = parseInt(matchQuartos[1], 10);

      const matchBanhos = featuresText.match(/(\d+)\s*banheiros?/i);
      if (matchBanhos) banheiros = parseInt(matchBanhos[1], 10);

      const matchVagas = featuresText.match(/(\d+)\s*vagas?/i);
      if (matchVagas) vagas = parseInt(matchVagas[1], 10);

      const isRent = $(el).find('.ValorDesc').text().toLowerCase().includes('locação') || titulo.toLowerCase().includes('locação');

      if (titulo && link) {
        imoveis.push({
          site: 'VLICIT IMÓVEIS',
          titulo,
          valor,
          area,
          areaTotal: area,
          quartos,
          banheiros,
          vagas,
          link,
          imagens,
          endereco,
          descricao: featuresText.substring(0, 150),
          precoPorMetro: area > 0 ? Math.round(valor / area) : 0,
          entrada: 0,
          tipo: isRent ? 'aluguel' : 'venda',
        });
      }
    });

    return { imoveis, qtd: imoveis.length };
  }
};

export default vlicitimoveis;
