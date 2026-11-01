import { load } from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName, getFixValue, cleanTitle } from '../utils';

export default {
  name: 'imobiliariaestillo.com.br',
  driver: 'axios',
  enabled: true,
  url: 'https://www.imobiliariaestillo.com.br/imoveis/a-venda',
  itemsPerPage: 24,
  getPaginateParams: () => ({}),
  adapter: async (html: string) => {
    const properties: Imoveis[] = [];
    const $ = load(html);

    $('.resultado').each((_, el) => {
      const urlPath = $(el).find('.foto a').attr('href');
      if (!urlPath) return;
      const link = `https://www.imobiliariaestillo.com.br${urlPath}`;

      const titulo = cleanTitle($(el).find('.foto img').attr('title') || 'Imóvel em Franca');
      const imagens: string[] = [];
      const img = $(el).find('.foto img').attr('src');
      if (img) imagens.push(img);

      const priceText = $(el).find('.valor h5').text().replace(/[^0-9,]/g, '').replace(',', '.');
      const valor = parseFloat(priceText) || 0;

      const type = $(el).find('.tipo').text().trim();
      const endereco = normalizeNeighborhoodName($(el).find('.bairro').text().trim());
      const bedroomsText = $(el).find('.detalhes [title="Dormitórios"] span').text();
      const bathroomsText = $(el).find('.detalhes [title="Banheiros"] span').text();
      const parkingText = $(el).find('.detalhes [title="Vagas"] span').text();
      const areaText = $(el).find('.detalhes [title="Área"] span').first().text();

      const area = getFixValue(areaText);

      properties.push({
        site: 'imobiliariaestillo.com.br',
        link,
        titulo,
        valor,
        imagens,
        descricao: type || 'Imóvel',
        endereco: endereco || '',
        quartos: parseInt(bedroomsText, 10) || 0,
        banheiros: parseInt(bathroomsText, 10) || 0,
        vagas: parseInt(parkingText, 10) || 0,
        area: area,
        areaTotal: area,
        precoPorMetro: area > 0 ? Math.round(valor / area) : 0,
        entrada: valor * 0.2, // 20%
        tipo: 'venda'
      });
    });

    return { imoveis: properties, qtd: properties.length };
  }
} as Site;
