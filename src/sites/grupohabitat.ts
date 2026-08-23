import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  url: 'https://grupohabitat.com.br/comprar/sp/franca/',
  name: 'grupohabitat.com.br',
  driver: 'axios',
  itemsPerPage: 10,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://grupohabitat.com.br/comprar/sp/franca?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  let qtd = 0;
  const qtdMatch = html.match(/(\d+)\s+imóveis/i);
  if (qtdMatch) {
      qtd = parseInt(qtdMatch[1]);
  }

  if (qtd === 0) qtd = 1000;

  const imoveis: Imoveis[] = [];

  $('.link_resultado').each((_i, el) => {
    const linkAttr = $(el).find('a.foto_imovel').attr('href') || $(el).find('a.botao_ver_mais').attr('href');
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://grupohabitat.com.br${linkAttr}`) : '';

    const titulo = $(el).find('.titulo_novo').text().trim() || 'IMÓVEL';

    const priceText = $(el).find('.valor_novo h5').text().trim();
    let valor = 0;
    if (priceText.toLowerCase().includes('sob consulta')) {
        valor = 0;
    } else {
        valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');
    }

    const locText = $(el).find('.final_card span').text().trim(); // e.g. "Jardim Adelinha - Franca/SP"
    const bairro = locText.split('-')[0].trim();
    const endereco = normalizeNeighborhoodName(bairro);

    const imgSrc = $(el).find('.swiper-slide img').first().attr('src');
    const imagens = imgSrc ? [imgSrc] : [];

    let quartos = 0, banheiros = 0, vagas = 0, area = 0;

    $(el).find('.detalhe_novo').each((_j, det) => {
        const text = $(det).text().trim().toLowerCase();
        const val = parseInt($(det).find('span').first().text()) || 0;

        if (text.includes('quarto') || text.includes('dorm')) {
            quartos = val;
        } else if (text.includes('banheiro')) {
            banheiros = val;
        } else if (text.includes('vaga') || text.includes('garag')) {
            vagas = val;
        } else if (text.includes('m²') || text.includes('área')) {
            area = val;
        }
    });

    if (link && valor > 0) {
        imoveis.push({
            titulo,
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
            site: 'grupohabitat.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
