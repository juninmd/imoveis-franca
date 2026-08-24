import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.moradiaimoveisfranca.com.br/imoveis/a-venda/pagina-1',
  name: 'moradiaimoveisfranca.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.moradiaimoveisfranca.com.br/imoveis/a-venda/pagina-${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtdText = $('.quantidade').text();
  const qtdMatch = qtdText.match(/(\d+)\s*imóve/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : $('.resultado').length;

  const imoveis: Imoveis[] = [];

  $('.info_imoveis').each((_, el) => {
    const parent = $(el).parent();
    const linkAttr = parent.find('.foto a').first().attr('href');
    const isRental = linkAttr && linkAttr.includes('/alugar/');
    if (isRental) return;

    const tipo = $(el).find('.tipo').text().trim();
    const bairro = $(el).find('.bairro').text().trim();
    const titulo = `${tipo} - ${bairro}`;
    if (!titulo || titulo === ' - ') return;

    const endereco = normalizeNeighborhoodName(bairro);

    let valor = 0;
    const valorStr = $(el).find('.valor h5').text().trim();
    const valorMatch = valorStr.match(/R\$\s*([\d.]+,\d{2})/);
    if (valorMatch) {
       valor = parseFloat(valorMatch[1].replace(/\./g, '').replace(',', '.'));
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.detalhe').each((_, det) => {
       const text = $(det).text().trim();
       const titleAttr = $(det).attr('title') || '';
       if (titleAttr.includes('Área') || text.includes('m²')) {
          area = parseFloat(text.replace('m²', '').trim()) || 0;
       } else if (titleAttr.includes('Dormitório')) {
          quartos = parseInt(text) || 0;
       } else if (titleAttr.includes('Banheiro')) {
          banheiros = parseInt(text) || 0;
       } else if (titleAttr.includes('Vagas')) {
          vagas = parseInt(text) || 0;
       }
    });

    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://www.moradiaimoveisfranca.com.br${linkAttr}`) : '';

    const imgUrl = parent.find('.foto img').attr('src');
    const imagens = imgUrl ? [imgUrl.startsWith('http') ? imgUrl : `https://www.moradiaimoveisfranca.com.br${imgUrl}`] : [];

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
            site: 'moradiaimoveisfranca.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
