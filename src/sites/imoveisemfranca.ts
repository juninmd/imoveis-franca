import { Site, Imoveis } from '../types';
import * as cheerio from 'cheerio';

const imoveisemfranca: Site = {
  name: 'imoveisemfranca.com.br',
  driver: 'axios',
  enabled: true,
  url: 'https://www.imoveisemfranca.com.br/',
  itemsPerPage: 12,
  getPaginateParams: (page: number) => {
    return { path: `https://portal.maxmasimob.com.br/cidade/franca-sp?page=${page}` };
  },
  adapter: async (html: string) => {
    const $ = cheerio.load(html);
    const imoveis: Imoveis[] = [];

    $('.card').each((_i, el) => {
      const linkAttr = $(el).find('a.card-btn').attr('href');
      const imgAttr = $(el).find('img').attr('src');
      const priceStr = $(el).find('.card-preco').text().trim();
      const titulo = $(el).find('.card-tipo').text().trim();
      const end = $(el).find('.card-end').text().trim();
      const bairro = $(el).find('.card-bairro').text().trim();

      const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://www.imoveisemfranca.com.br${linkAttr}`) : '';
      const imagens = imgAttr ? [imgAttr.startsWith('http') ? imgAttr : `https://www.imoveisemfranca.com.br${imgAttr}`] : [];

      let valor = parseFloat(priceStr.replace(/[R$\s.]/g, '').replace(',', '.'));
      if (isNaN(valor)) valor = 0;

      let area = 0, quartos = 0, banheiros = 0, vagas = 0;
      $(el).find('.card-info span').each((_j, info) => {
        const text = $(info).text().trim().toLowerCase();
        const num = parseInt(text.replace(/\D/g, ''), 10);
        if (!isNaN(num)) {
          if (text.includes('m²')) area = num;
          if (text.includes('quarto') || text.includes('dorm')) quartos = num;
          if (text.includes('banheiro') || text.includes('suíte')) banheiros = num;
          if (text.includes('vaga')) vagas = num;
        }
      });

      if (link && valor > 0) {
        imoveis.push({
          site: 'imoveisemfranca.com.br',
          titulo: titulo || 'Imóvel',
          descricao: '',
          imagens,
          endereco: `${end}${bairro ? ' - ' + bairro : ''}`,
          valor,
          area,
          areaTotal: area,
          quartos,
          banheiros,
          vagas,
          link,
          entrada: 0,
          precoPorMetro: area > 0 ? valor / area : 0
        });
      }
    });

    return {
      imoveis,
      qtd: imoveis.length > 0 ? 100 : 0 // Estimate or fallback
    };
  }
};

export default imoveisemfranca;
