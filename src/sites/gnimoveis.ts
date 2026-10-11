import * as cheerio from 'cheerio';
import { Imoveis, Site } from '../types';
import { normalizeNeighborhoodName } from '../utils';

export default {
  enabled: true,
  tipo: 'venda',
  url: 'https://www.gnimoveis.com.br/venda/imoveis/franca?valorminimo=0&valormaximo=0&pagina=1',
  name: 'gnimoveis.com.br',
  driver: 'puppet',
  itemsPerPage: 12,
  params: [],
  getPaginateParams: (page: number) => {
    return { url: `https://www.gnimoveis.com.br/venda/imoveis/franca?valorminimo=0&valormaximo=0&pagina=${page}` };
  },
  adapter,
} as Site;

export async function adapter(html: string): Promise<{ imoveis: Imoveis[], qtd: number, html: string }> {
  const $ = cheerio.load(html);

  const bodyText = $('body').text();
  const qtdMatch = bodyText.match(/(\d+)\s*Imóveis encontrados/i);
  const qtd = qtdMatch ? Number(qtdMatch[1]) : 0;

  const imoveis: Imoveis[] = [];

  const items = $('.property, .imovel, a[href*="imovel"], div[class*="imovel"]');

  items.each((_i, el) => {
    const titulo = $(el).find('h2, h3, h4').first().text().trim() || $(el).find('.title, .titulo').text().trim();
    if (!titulo || titulo.length < 5) return;

    let endereco = titulo;
    if (titulo.includes('-')) {
        const parts = titulo.split('-');
        endereco = parts[parts.length - 1].trim();
    }
    endereco = normalizeNeighborhoodName(endereco);

    const priceText = $(el).find('b:contains("R$"), span:contains("R$"), p:contains("R$")').text().trim() || $(el).text().match(/R\$\s*[\d.,]+/)?.[0] || '0';
    const valor = parseFloat(priceText.replace('R$', '').replace(/\./g, '').replace(',', '.').trim() || '0');

    const detailsText = $(el).text();
    let area = 0, quartos = 0, banheiros = 0, vagas = 0;

    if (detailsText.match(/(\d+)\s*m²/)) {
        area = parseFloat(detailsText.match(/(\d+)\s*m²/)?.[1] || '0');
    }

    if (detailsText.match(/(\d+)\s*quartos/i) || detailsText.match(/(\d+)\s*dorm/i)) {
        quartos = parseInt(detailsText.match(/(\d+)\s*(quartos|dorm)/i)?.[1] || '0');
    }

    if (detailsText.match(/(\d+)\s*banh/i) || detailsText.match(/(\d+)\s*wc/i)) {
        banheiros = parseInt(detailsText.match(/(\d+)\s*(banh|wc)/i)?.[1] || '0');
    }

    if (detailsText.match(/(\d+)\s*(vagas|vaga)/i) || detailsText.match(/(\d+)\s*garagem/i)) {
        vagas = parseInt(detailsText.match(/(\d+)\s*(vagas|vaga|garagem)/i)?.[1] || '0');
    }

    const linkAttr = $(el).find('a').attr('href') || ($(el).is('a') ? $(el).attr('href') : '');
    const link = linkAttr ? (linkAttr.startsWith('http') ? linkAttr : `https://www.gnimoveis.com.br${linkAttr.startsWith('/') ? '' : '/'}${linkAttr}`) : '';

    const imgRel = $(el).find('img').attr('src');
    const imagens = imgRel ? [imgRel.startsWith('http') ? imgRel : `https://www.gnimoveis.com.br${imgRel.startsWith('/') ? '' : '/'}${imgRel}`] : [];

    if (link && valor > 0 && !imoveis.find(i => i.link === link)) {
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
            site: 'gnimoveis.com.br',
            entrada: valor * 0.20
        });
    }
  });

  return { imoveis, qtd, html };
}
