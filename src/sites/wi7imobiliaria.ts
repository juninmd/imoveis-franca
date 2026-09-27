import * as cheerio from 'cheerio';
import { Site, Imoveis } from '../types';
import { getFixValue, normalizeNeighborhoodName as cleanTitle } from '../utils';

const site: Site = {
  name: 'wi7imobiliaria',
  driver: 'axios',
  enabled: true,
  url: 'https://www.wi7imobiliaria.com.br/imoveis/venda',
  itemsPerPage: 12,
  getPaginateParams: (page) => ({ path: `/pagina-${page}` }),
  adapter: async (html: string) => {
    const $ = cheerio.load(html);

    const qtdStr = $('.pagination a').last().prev().text().trim();
    let qtd = parseInt(qtdStr);

    const imoveis: Imoveis[] = [];

    $('.recent-properties-box').each((_i, el) => {
       const box = $(el).parent();

       const link = box.find('a').first().attr('href') || '';
       if (!link) return;

       const type = box.find('a[href^="https://www.wi7imobiliaria.com.br/imovel/"]').last().attr('href')?.split('/').slice(-2, -1)[0];
       const typeMap: Record<string, string> = {
         'barracao': 'Barracão',
         'sitio': 'Sítio',
         'terreno': 'Terreno',
         'apartamento': 'Apartamento',
         'casa': 'Casa',
         'chacara': 'Chácara',
         'sobrado': 'Sobrado'
       };
       const formattedType = type ? (typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1)) : 'Imóvel';

       const location = box.find('.location').text().trim();
       let title = formattedType;
       if (location) {
         title += ' em ' + location;
       }

       const priceStr = box.find('.price').text().trim() || box.find('.tag-s').text().trim() || box.find('.tag-f').text().trim() || box.find('.tag-sale').text().trim();
       const valor = getFixValue(priceStr.replace(/[^0-9,]/g, ''));

       let infoText = "";
       box.find('li').each((_j, li) => { infoText += $(li).text() + " "; });
       const quartosMatch = infoText.match(/(\d+)\s*Quarto/i);
       const banheirosMatch = infoText.match(/(\d+)\s*Banheiro/i);
       const vagasMatch = infoText.match(/(\d+)\s*Garagem/i);

       const quartos = quartosMatch ? parseInt(quartosMatch[1]) : 0;
       const banheiros = banheirosMatch ? parseInt(banheirosMatch[1]) : 0;
       const vagas = vagasMatch ? parseInt(vagasMatch[1]) : 0;

       let areaInfo = "";
       box.find('.flaticon-square').parent().each((_j, a) => { areaInfo += $(a).text() + " "; });
       const area = getFixValue(areaInfo.replace(/[^0-9,]/g, '')) || 0;

       let img = box.find('img').first().attr('src') || box.find('img').first().attr('data-src') || box.find('img').first().attr('data-original') || '';

       if (valor > 0) {
           imoveis.push({
              site: 'wi7imobiliaria',
              titulo: cleanTitle(title),
              descricao: title,
              imagens: [img],
              endereco: location,
              valor: valor,
              area: area,
              areaTotal: area,
              quartos: quartos,
              link: link,
              banheiros: banheiros,
              vagas: vagas,
              precoPorMetro: area > 0 ? (valor / area) : 0,
              entrada: valor * 0.2,
           });
       }
    });

    qtd = (qtd > 0 ? qtd : (imoveis.length > 0 ? 1 : 0)) * 12;

    return {
      qtd: (qtd > 0 && imoveis.length > 0) ? qtd : (imoveis.length > 0 ? imoveis.length : 0),
      imoveis,
    };
  }
};

export default site;
