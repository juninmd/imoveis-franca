import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.cintraimoveis.com.br/comprar/sp/franca/',
  name: 'cintraimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.cintraimoveis.com.br/comprar/sp/franca/pagina-${page}/` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);
  const imoveis: Imoveis[] = [];

  const qtdText = $('h1').text();
  const qtdMatch = qtdText.match(/(\d+)\s+imóveis/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  $('.resultado_novo').each((_i, el) => {
    const linkEl = $(el).find('a.botao_ver_mais').first();
    const linkAttr = linkEl.attr('href');
    if (!linkAttr) return;
    const link = `https://www.cintraimoveis.com.br${linkAttr}`;

    const titulo = $(el).find('.titulo_novo').text().trim();
    if (!titulo) return;

    const addressStr = $(el).find('.bairro_novo').text().trim();
    const endereco = normalizeNeighborhoodName(addressStr || 'Centro');

    let valor = 0;
    $(el).find('.valor_novo').each((_j, valEl) => {
        const t = $(valEl).text().toLowerCase();
        if(t.includes('venda') || t.includes('r$')) {
            const vText = $(valEl).find('h5').text().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            valor = parseFloat(vText || '0');
        }
    });

    if (valor <= 0) return;

    let area = 0, quartos = 0, banheiros = 0, vagas = 0;
    $(el).find('.icone_lista_novo').each((_k, featEl) => {
       const text = $(featEl).text().toLowerCase().trim();
       if (text.includes('m²')) {
           area = parseFloat(text.replace('m²', '').replace(',', '.').trim()) || 0;
       } else if (text.includes('dorm')) {
           quartos += parseInt(text) || 0;
       } else if (text.includes('banh')) {
           banheiros += parseInt(text) || 0;
       } else if (text.includes('vaga')) {
           vagas += parseInt(text) || 0;
       }
    });

    const imgEl = $(el).find('.swiper-slide img').first();
    const imgUrl = imgEl.attr('src');
    const imagens = imgUrl ? [imgUrl] : [];

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
        site: 'cintraimoveis.com.br',
        entrada: valor * 0.20
    });
  });

  return { imoveis, qtd, html };
}
