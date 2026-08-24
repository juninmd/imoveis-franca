import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.andresaborgesimoveis.com.br/imoveis.php',
  name: 'andresaborgesimoveis.com.br',
  driver: 'axios',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.andresaborgesimoveis.com.br/imoveis.php?pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const qtd = $('.c49-property-card').length;

  const imoveis: Imoveis[] = [];

  $('.c49-property-card').each((_, el) => {
    const titulo = $(el).find('.c49-property-card_title').text().trim();
    if (!titulo) return;

    const locationStr = $(el).find('.c49-property-card_address').text().replace(',', '').replace('-', '').replace('SP', '').replace('Franca', '').trim();
    const endereco = normalizeNeighborhoodName(locationStr);

    const isRental = titulo.toLowerCase().includes('locação') || titulo.toLowerCase().includes('alugar');
    if (isRental) return;

    let valor = 0;
    const valorStr = $(el).find('.c49-property-card_rent-price, .c49-property-card_sell-price').text().trim();
    const valorMatch = valorStr.match(/[\d.,]+/);
    if (valorMatch) {
       valor = parseFloat(valorMatch[0].replace(/\./g, '').replace(',', '.'));
    }

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.c49-property-number-wrap').each((_, wrap) => {
        const text = $(wrap).find('.c49-property-number').text().trim();
        const iconClass = $(wrap).find('span').attr('class') || '';

        if (text.includes('m²')) {
            area = parseFloat(text.replace('m²', '').trim()) || 0;
        } else if (iconClass.includes('bedroom') || text.includes('quarto')) {
            quartos = parseInt(text) || 0;
        } else if (iconClass.includes('garage') || text.includes('vaga')) {
            vagas = parseInt(text) || 0;
        }

        if (iconClass.includes('bathroom') || text.includes('banheiro')) {
            banheiros = parseInt(text) || 0;
        }
    });

    const linkAttr = $(el).find('.c49-property-card_header').attr('onclick') || '';
    const linkMatch = linkAttr.match(/window\.open\('([^']+)'/);
    const link = linkMatch ? linkMatch[1] : '';

    const imagens: string[] = [];
    $(el).find('.c49-property-card_slide img').each((_, img) => {
       const src = $(img).attr('src');
       if (src) imagens.push(src);
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
            site: 'andresaborgesimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
